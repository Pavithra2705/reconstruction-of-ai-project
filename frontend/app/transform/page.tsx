"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shuffle, Plus, Trash2, ChevronDown, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type TransformType = "filter_rows" | "drop_columns" | "rename_column" | "sort_data" | "group_aggregate" | "bin_column" | "normalize_column" | "convert_type" | "extract_datetime";

interface PipelineStep { type: string; params: Record<string, unknown>; timestamp: string }
interface PreviewRow { [key: string]: string | number | null }

const TRANSFORM_LABELS: Record<TransformType, string> = {
    filter_rows: "Filter Rows", drop_columns: "Drop Columns", rename_column: "Rename Column",
    sort_data: "Sort Data", group_aggregate: "Group & Aggregate", bin_column: "Bin Column",
    normalize_column: "Normalize Column", convert_type: "Convert Type", extract_datetime: "Extract Datetime",
};

export default function TransformPage() {
    const [cols, setCols] = useState<string[]>([]);
    const [numCols, setNumCols] = useState<string[]>([]);
    const [steps, setSteps] = useState<PipelineStep[]>([]);
    const [preview, setPreview] = useState<PreviewRow[]>([]);
    const [previewCols, setPreviewCols] = useState<string[]>([]);
    const [shape, setShape] = useState<number[] | null>(null);
    const [selectedType, setSelectedType] = useState<TransformType>("filter_rows");
    const [applying, setApplying] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Params state per transform type
    const [filterCol, setFilterCol] = useState("");
    const [filterOp, setFilterOp] = useState("equals");
    const [filterVal, setFilterVal] = useState("");
    const [dropCols, setDropCols] = useState("");
    const [renameOld, setRenameOld] = useState("");
    const [renameNew, setRenameNew] = useState("");
    const [sortCol, setSortCol] = useState("");
    const [sortAsc, setSortAsc] = useState(true);
    const [grpBy, setGrpBy] = useState("");
    const [grpAggCol, setGrpAggCol] = useState("");
    const [grpFn, setGrpFn] = useState("mean");
    const [binCol, setBinCol] = useState("");
    const [binCount, setBinCount] = useState(5);
    const [normCol, setNormCol] = useState("");
    const [normMethod, setNormMethod] = useState("minmax");
    const [convCol, setConvCol] = useState("");
    const [convType, setConvType] = useState("string");
    const [dtCol, setDtCol] = useState("");
    const [dtComp, setDtComp] = useState("year");

    useEffect(() => {
        Promise.all([
            fetch(`${API}/columns`).then(r => r.json()),
            fetch(`${API}/transform/history`).then(r => r.json()),
        ]).then(([colData, hist]) => {
            setCols(colData.columns || []);
            setNumCols(colData.numeric_columns || []);
            setSteps(hist.steps || []);
        }).catch(() => setError("Upload a dataset first.")).finally(() => setLoading(false));
    }, []);

    const buildParams = (): Record<string, unknown> => {
        switch (selectedType) {
            case "filter_rows": return { column: filterCol || cols[0], operator: filterOp, value: filterVal };
            case "drop_columns": return { columns: dropCols.split(",").map(s => s.trim()).filter(Boolean) };
            case "rename_column": return { old_name: renameOld || cols[0], new_name: renameNew };
            case "sort_data": return { columns: sortCol || cols[0], ascending: sortAsc };
            case "group_aggregate": return { group_by: grpBy || cols[0], agg_column: grpAggCol || numCols[0], agg_function: grpFn };
            case "bin_column": return { column: binCol || numCols[0], bins: binCount };
            case "normalize_column": return { column: normCol || numCols[0], method: normMethod };
            case "convert_type": return { column: convCol || cols[0], type: convType };
            case "extract_datetime": return { column: dtCol || cols[0], component: dtComp };
            default: return {};
        }
    };

    const applyTransform = async () => {
        setApplying(true); setError(null);
        try {
            const res = await fetch(`${API}/transform`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: selectedType, params: buildParams() }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed"); }
            const data = await res.json();
            setPreview(data.preview || []);
            setPreviewCols(data.columns || []);
            setShape(data.shape);
            const hist = await fetch(`${API}/transform/history`).then(r => r.json());
            setSteps(hist.steps || []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Transform failed");
        } finally { setApplying(false); }
    };

    const clearPipeline = async () => {
        setClearing(true);
        try {
            await fetch(`${API}/transform/clear`, { method: "POST" });
            setSteps([]); setPreview([]); setShape(null);
        } finally { setClearing(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-bold mb-2"><span className="gradient-text">Transform</span></h1>
                <p className="text-muted-foreground">Build a visual data transformation pipeline — filter, rename, aggregate, normalize, and more</p>
            </motion.div>

            {error && <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Transformation */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-green-400" /> Add Transformation</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-muted-foreground font-medium">Transform Type</label>
                            <div className="relative mt-1">
                                <select value={selectedType} onChange={e => setSelectedType(e.target.value as TransformType)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                                    {(Object.entries(TRANSFORM_LABELS) as [TransformType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Dynamic Params */}
                        {selectedType === "filter_rows" && (
                            <>
                                <ColSelect label="Column" val={filterCol} set={setFilterCol} options={cols} />
                                <div><label className="text-xs text-muted-foreground font-medium">Operator</label>
                                    <div className="relative mt-1"><select value={filterOp} onChange={e => setFilterOp(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none appearance-none">
                                        {["equals", "not_equals", "greater_than", "less_than", "contains", "not_contains", "is_null", "not_null"].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select><ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" /></div>
                                </div>
                                <TextInput label="Value" val={filterVal} set={setFilterVal} placeholder="Enter filter value" />
                            </>
                        )}
                        {selectedType === "drop_columns" && <TextInput label="Columns (comma-separated)" val={dropCols} set={setDropCols} placeholder="col1, col2, col3" />}
                        {selectedType === "rename_column" && (<>
                            <ColSelect label="Old Name" val={renameOld} set={setRenameOld} options={cols} />
                            <TextInput label="New Name" val={renameNew} set={setRenameNew} placeholder="new_column_name" />
                        </>)}
                        {selectedType === "sort_data" && (<>
                            <ColSelect label="Sort Column" val={sortCol} set={setSortCol} options={cols} />
                            <label className="flex items-center gap-3 cursor-pointer text-sm mt-1">
                                <div onClick={() => setSortAsc(!sortAsc)} className={`w-10 h-5 rounded-full transition-colors relative ${sortAsc ? "bg-primary" : "bg-white/20"}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sortAsc ? "translate-x-5" : "translate-x-0.5"}`} />
                                </div>
                                Ascending
                            </label>
                        </>)}
                        {selectedType === "group_aggregate" && (<>
                            <ColSelect label="Group By" val={grpBy} set={setGrpBy} options={cols} />
                            <ColSelect label="Aggregate Column" val={grpAggCol} set={setGrpAggCol} options={numCols} />
                            <div><label className="text-xs text-muted-foreground font-medium">Function</label>
                                <div className="relative mt-1"><select value={grpFn} onChange={e => setGrpFn(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none appearance-none">
                                    {["mean", "sum", "count", "min", "max"].map(f => <option key={f} value={f}>{f}</option>)}
                                </select><ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" /></div>
                            </div>
                        </>)}
                        {selectedType === "bin_column" && (<>
                            <ColSelect label="Column" val={binCol} set={setBinCol} options={numCols} />
                            <div><label className="text-xs text-muted-foreground font-medium">Number of Bins: {binCount}</label>
                                <input type="range" min={2} max={20} value={binCount} onChange={e => setBinCount(Number(e.target.value))} className="w-full mt-1 accent-primary" />
                            </div>
                        </>)}
                        {selectedType === "normalize_column" && (<>
                            <ColSelect label="Column" val={normCol} set={setNormCol} options={numCols} />
                            <div><label className="text-xs text-muted-foreground font-medium">Method</label>
                                <div className="relative mt-1"><select value={normMethod} onChange={e => setNormMethod(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none appearance-none">
                                    <option value="minmax">Min-Max (0-1)</option><option value="zscore">Z-Score</option>
                                </select><ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" /></div>
                            </div>
                        </>)}
                        {selectedType === "convert_type" && (<>
                            <ColSelect label="Column" val={convCol} set={setConvCol} options={cols} />
                            <div><label className="text-xs text-muted-foreground font-medium">New Type</label>
                                <div className="relative mt-1"><select value={convType} onChange={e => setConvType(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none appearance-none">
                                    {["int", "float", "string", "datetime", "category"].map(t => <option key={t} value={t}>{t}</option>)}
                                </select><ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" /></div>
                            </div>
                        </>)}
                        {selectedType === "extract_datetime" && (<>
                            <ColSelect label="Datetime Column" val={dtCol} set={setDtCol} options={cols} />
                            <div><label className="text-xs text-muted-foreground font-medium">Component</label>
                                <div className="relative mt-1"><select value={dtComp} onChange={e => setDtComp(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none appearance-none">
                                    {["year", "month", "day", "dayofweek", "hour", "quarter"].map(c => <option key={c} value={c}>{c}</option>)}
                                </select><ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" /></div>
                            </div>
                        </>)}

                        <button onClick={applyTransform} disabled={applying}
                            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60">
                            {applying ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Applying...</> : <><Shuffle className="w-4 h-4" />Apply Transformation</>}
                        </button>
                    </div>
                </motion.div>

                {/* Pipeline Steps */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-xl flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-blue-400" /> Pipeline Steps ({steps.length})</h2>
                        {steps.length > 0 && (
                            <button onClick={clearPipeline} disabled={clearing} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition flex items-center gap-1">
                                {clearing ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-3 h-3" />} Clear
                            </button>
                        )}
                    </div>
                    {steps.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                            <div><RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No transformations yet.<br />Add one from the left panel.</p></div>
                        </div>
                    ) : (
                        <div className="space-y-2 overflow-y-auto flex-1">
                            {steps.map((s, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold">{TRANSFORM_LABELS[s.type as TransformType] || s.type}</p>
                                        <p className="text-xs text-muted-foreground truncate">{JSON.stringify(s.params)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {shape && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-white/10">Current shape: {shape[0]} rows × {shape[1]} columns</p>}
                </motion.div>
            </div>

            {/* Data Preview */}
            {preview.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-xl">
                    <h2 className="text-xl font-bold mb-4">Data Preview (first 10 rows)</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-white/10">
                                    {previewCols.map(c => <th key={c} className="px-3 py-2 text-left text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">{c}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {preview.map((row, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                        {previewCols.map(c => <td key={c} className="px-3 py-2 whitespace-nowrap">{String(row[c] ?? "")}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function ColSelect({ label, val, set, options }: { label: string; val: string; set: (v: string) => void; options: string[] }) {
    return (
        <div>
            <label className="text-xs text-muted-foreground font-medium">{label}</label>
            <div className="relative mt-1">
                <select value={val} onChange={e => set(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
        </div>
    );
}

function TextInput({ label, val, set, placeholder }: { label: string; val: string; set: (v: string) => void; placeholder: string }) {
    return (
        <div>
            <label className="text-xs text-muted-foreground font-medium">{label}</label>
            <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                className="w-full mt-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
    );
}
