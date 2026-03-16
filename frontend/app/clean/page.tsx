"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Database, Trash2, ArrowRight, BarChart2, Download, Table } from "lucide-react";

import { API_BASE } from "@/lib/api";

const API = API_BASE;

const SEL = "w-full mt-1 bg-[#0f0f1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary";
const OPT = "bg-[#0f0f1a] text-white";

interface CleaningReport {
    summary?: { original_shape?: number[]; final_shape?: number[]; rows_removed?: number; cleaning_efficiency?: string };
    duplicate_removal?: { duplicates_found?: number; duplicates_removed?: number };
    missing_value_handling?: { missing_values_before?: number; missing_values_after?: number; missing_by_column_before?: Record<string, number>; strategy_used?: string };
    outlier_handling?: Record<string, { outliers_found?: number; lower_bound?: number; upper_bound?: number }>;
    data_type_conversion?: { converted_columns?: { column: string; from: string; to: string }[] };
}

interface CleanData {
    cleaning_report: CleaningReport;
    before_shape: number[] | null;
    after_shape: number[];
    columns: string[];
    dtypes: Record<string, string>;
    preview?: {
        after?: {
            columns: string[];
            rows: Record<string, string | number | null>[];
        };
    };
}

interface PreviewData {
    columns: string[];
    rows: Record<string, string | number | null>[];
    shape: { rows: number; columns: number };
}

export default function CleanPage() {
    const [data, setData] = useState<CleanData | null>(null);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [rerunning, setRerunning] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const [removeDuplicates, setRemoveDuplicates] = useState(true);
    const [detectOutliers, setDetectOutliers] = useState(true);
    const [normalize, setNormalize] = useState(false);
    const [missingStrategy, setMissingStrategy] = useState("Auto");

    useEffect(() => { fetchCleanData(); }, []);

    const fetchCleanData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API}/clean`);
            if (!res.ok) throw new Error("No dataset uploaded yet.");
            setData(await res.json());
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load cleaning report");
        } finally { setLoading(false); }
    };

    const fetchPreview = async () => {
        setPreviewLoading(true);
        try {
            const res = await fetch(`${API}/preview/cleaned`);
            if (!res.ok) throw new Error("Failed to fetch preview");
            const json = await res.json();
            setPreview(json);
            setShowPreview(true);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Preview failed");
        } finally { setPreviewLoading(false); }
    };

    const runCleaning = async () => {
        setRerunning(true);
        try {
            const res = await fetch(`${API}/clean/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ remove_duplicates: removeDuplicates, missing_strategy: missingStrategy, detect_outliers: detectOutliers, normalize }),
            });
            if (!res.ok) throw new Error("Cleaning failed");
            await fetchCleanData();
            // Refresh preview if it was already open
            if (showPreview) await fetchPreview();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Cleaning failed");
        } finally { setRerunning(false); }
    };

    const downloadCSV = async () => {
        setDownloading(true);
        try {
            const res = await fetch(`${API}/preview/cleaned`);
            if (!res.ok) throw new Error("Failed to fetch cleaned data");
            const json = await res.json();
            const columns: string[] = json.columns || [];
            const rows: Record<string, string | number | null>[] = json.rows || [];
            const escape = (val: unknown) => {
                const str = val === null || val === undefined ? "" : String(val);
                return str.includes(",") || str.includes('"') || str.includes("\n")
                    ? `"${str.replace(/"/g, '""')}"` : str;
            };
            const csvContent = [
                columns.map(escape).join(","),
                ...rows.map(row => columns.map(col => escape(row[col])).join(","))
            ].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `cleaned_dataset_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Download failed");
        } finally { setDownloading(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Loading cleaning report...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="space-y-4">
            <h1 className="text-4xl font-bold"><span className="gradient-text">Data Cleaning</span></h1>
            <div className="glass-card p-8 rounded-xl text-center">
                <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <p className="text-orange-400 font-semibold text-lg">{error}</p>
                <p className="text-muted-foreground mt-2">Please upload a dataset first from the Upload tab.</p>
            </div>
        </div>
    );

    const report = data?.cleaning_report;
    const summary = report?.summary;
    const missing = report?.missing_value_handling;
    const outliers = report?.outlier_handling;
    const types = report?.data_type_conversion?.converted_columns || [];
    const missingCols = missing?.missing_by_column_before || {};
    const outlierCols = Object.entries(outliers || {}).filter(([k]) => k !== "total_outliers" && k !== "method");

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-bold mb-2"><span className="gradient-text">Data Cleaning</span></h1>
                    <p className="text-muted-foreground text-lg">Automated cleaning pipeline — remove noise, handle missing values, detect outliers</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={fetchPreview}
                        disabled={previewLoading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-semibold transition disabled:opacity-60"
                    >
                        {previewLoading
                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Loading...</>
                            : <><Table className="w-4 h-4 text-blue-400" /> Preview Dataset</>
                        }
                    </button>
                    <button
                        onClick={downloadCSV}
                        disabled={downloading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 shadow-lg shadow-green-900/30"
                    >
                        {downloading
                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Downloading...</>
                            : <><Download className="w-4 h-4" /> Download Cleaned CSV</>
                        }
                    </button>
                </div>
            </motion.div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Rows Before", value: data?.before_shape?.[0] ?? "—", icon: Database, color: "from-blue-500 to-cyan-500" },
                    { label: "Rows After", value: data?.after_shape?.[0] ?? "—", icon: CheckCircle2, color: "from-green-500 to-emerald-500" },
                    { label: "Rows Removed", value: summary?.rows_removed ?? 0, icon: Trash2, color: "from-orange-500 to-red-500" },
                    { label: "Duplicates Found", value: report?.duplicate_removal?.duplicates_found ?? 0, icon: BarChart2, color: "from-purple-500 to-pink-500" },
                ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5 rounded-xl">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-2xl font-bold">{String(s.value)}</p>
                            <p className="text-sm text-muted-foreground">{s.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Missing Values */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-400" /> Missing Values
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">Strategy: <span className="text-primary font-semibold">{missing?.strategy_used || "Auto"}</span></p>
                    {Object.keys(missingCols).length === 0 ? (
                        <div className="flex items-center gap-2 text-green-400"><CheckCircle2 className="w-5 h-5" /> No missing values found</div>
                    ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {Object.entries(missingCols).filter(([, v]) => v > 0).map(([col, count]) => {
                                const total = data?.before_shape?.[0] || 1;
                                const pct = Math.round((count / total) * 100);
                                return (
                                    <div key={col}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium truncate">{col}</span>
                                            <span className="text-muted-foreground">{count} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Outliers */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-purple-400" /> Outlier Handling
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">Method: <span className="text-primary font-semibold">IQR Capping</span> — Total: <span className="font-bold text-foreground">{(outliers as Record<string, number | string>)?.total_outliers ?? 0}</span></p>
                    {outlierCols.length === 0 ? (
                        <div className="flex items-center gap-2 text-green-400"><CheckCircle2 className="w-5 h-5" /> No outliers detected</div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {outlierCols.map(([col, info]) => (
                                <div key={col} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                    <span className="font-medium text-sm truncate">{col}</span>
                                    <div className="text-right text-xs text-muted-foreground">
                                        <span className="text-purple-400 font-bold">{(info as { outliers_found?: number }).outliers_found ?? 0} outliers</span>
                                        <span className="ml-2">capped</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Type Conversions */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 rounded-xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <ArrowRight className="w-5 h-5 text-blue-400" /> Data Type Conversions
                    </h2>
                    {types.length === 0 ? (
                        <div className="flex items-center gap-2 text-green-400"><CheckCircle2 className="w-5 h-5" /> No type conversions needed</div>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {types.map((t, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 text-sm">
                                    <span className="font-medium">{t.column}</span>
                                    <span className="text-muted-foreground">{t.from} <ArrowRight className="w-3 h-3 inline" /> <span className="text-blue-400 font-semibold">{t.to}</span></span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Re-run Cleaning */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6 rounded-xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-green-400" /> Re-run Cleaning
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Missing Value Strategy</label>
                            <select value={missingStrategy} onChange={e => setMissingStrategy(e.target.value)} className={SEL}>
                                {["Auto", "Drop rows", "Drop columns", "Fill with mean/mode", "Forward fill", "Backward fill"].map(s => (
                                    <option key={s} value={s} className={OPT}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            {[
                                { label: "Remove Duplicates", val: removeDuplicates, set: setRemoveDuplicates },
                                { label: "Detect & Cap Outliers", val: detectOutliers, set: setDetectOutliers },
                                { label: "Normalize Numerical Columns", val: normalize, set: setNormalize },
                            ].map(({ label, val, set }) => (
                                <label key={label} className="flex items-center gap-3 cursor-pointer group">
                                    <div onClick={() => set(!val)} className={`w-10 h-5 rounded-full transition-colors relative ${val ? "bg-primary" : "bg-white/20"}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${val ? "translate-x-5" : "translate-x-0.5"}`} />
                                    </div>
                                    <span className="text-sm">{label}</span>
                                </label>
                            ))}
                        </div>
                        <button onClick={runCleaning} disabled={rerunning}
                            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
                            {rerunning ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Running...</> : <><Sparkles className="w-4 h-4" /> Apply Cleaning</>}
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Dataset Preview */}
            {showPreview && preview && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Table className="w-5 h-5 text-blue-400" /> Cleaned Dataset Preview
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                                Showing first {Math.min(preview.rows.length, 50)} of <span className="text-white font-semibold">{preview.shape.rows.toLocaleString()}</span> rows × <span className="text-white font-semibold">{preview.shape.columns}</span> columns
                            </span>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-muted-foreground transition"
                            >
                                Hide
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-white/10">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="px-3 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap w-10">#</th>
                                    {preview.columns.map(col => (
                                        <th key={col} className="px-3 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {preview.rows.slice(0, 50).map((row, i) => (
                                    <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"} hover:bg-white/5 transition-colors`}>
                                        <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                                        {preview.columns.map(col => (
                                            <td key={col} className="px-3 py-2 whitespace-nowrap max-w-[160px] truncate">
                                                {String(row[col] ?? "")}
                                            </td>
                                        ))}
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