"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Activity, AlertCircle, CheckCircle2, ChevronDown, Play, Zap } from "lucide-react";

import { API_BASE } from "@/lib/api";

const API = API_BASE;

interface DistInfo {
    column: string; count: number; mean: number; median: number; std: number;
    min: number; max: number; skewness: number; kurtosis: number; shape: string; tail_behavior?: string;
    normality_test?: { is_normal: boolean; p_value: number };
    outliers?: { count: number; percentage: number };
}

interface HypothesisResult { [key: string]: { test?: string; statistic?: number; p_value?: number; significant?: boolean; interpretation?: string; correlation?: number; error?: string } }
interface AnomalyResult { method?: string; total_anomalies?: number; anomaly_percentage?: number; contamination_rate?: number; error?: string }

export default function StatsPage() {
    const [distributions, setDistributions] = useState<Record<string, DistInfo>>({});
    const [numCols, setNumCols] = useState<string[]>([]);
    const [allCols, setAllCols] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Hypothesis
    const [col1, setCol1] = useState("");
    const [col2, setCol2] = useState("");
    const [hypoResult, setHypoResult] = useState<HypothesisResult | null>(null);
    const [hypoLoading, setHypoLoading] = useState(false);

    // Anomaly
    const [anomalyMethod, setAnomalyMethod] = useState("isolation_forest");
    const [contamination, setContamination] = useState(0.05);
    const [anomalyResult, setAnomalyResult] = useState<AnomalyResult | null>(null);
    const [anomalyLoading, setAnomalyLoading] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch(`${API}/stats`).then(r => r.json()),
            fetch(`${API}/columns`).then(r => r.json()),
        ]).then(([stats, cols]) => {
            setDistributions(stats.distributions || {});
            setNumCols(stats.numeric_columns || []);
            setAllCols(cols.columns || []);
            if (stats.numeric_columns?.[0]) setCol1(stats.numeric_columns[0]);
            if (stats.numeric_columns?.[1]) setCol2(stats.numeric_columns[1]);
        }).catch(e => setError(e.message)).finally(() => setLoading(false));
    }, []);

    const runHypothesis = async () => {
        setHypoLoading(true);
        try {
            const res = await fetch(`${API}/stats/hypothesis`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ col1, col2: col2 || undefined }),
            });
            setHypoResult(await res.json());
        } finally { setHypoLoading(false); }
    };

    const runAnomaly = async () => {
        setAnomalyLoading(true);
        try {
            const res = await fetch(`${API}/stats/anomalies`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ method: anomalyMethod, contamination }),
            });
            setAnomalyResult(await res.json());
        } finally { setAnomalyLoading(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );
    if (error) return (
        <div className="glass-card p-8 rounded-xl text-center mt-8">
            <FlaskConical className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <p className="text-orange-400 font-semibold">{error}</p>
            <p className="text-muted-foreground mt-2">Please upload a dataset first.</p>
        </div>
    );

    const distEntries = Object.entries(distributions);

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-bold mb-2"><span className="gradient-text">Advanced Statistics</span></h1>
                <p className="text-muted-foreground text-lg">Distribution analysis, hypothesis testing, and anomaly detection</p>
            </motion.div>

            {/* Distribution Cards */}
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-400" /> Distribution Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {distEntries.map(([col, info], i) => (
                        <motion.div key={col} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className="glass-card p-5 rounded-xl">
                            <h3 className="font-bold text-sm mb-3 truncate text-primary">{col}</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                {[
                                    ["Mean", info.mean?.toFixed(3)],
                                    ["Median", info.median?.toFixed(3)],
                                    ["Std Dev", info.std?.toFixed(3)],
                                    ["Min", info.min?.toFixed(3)],
                                    ["Max", info.max?.toFixed(3)],
                                    ["Skewness", info.skewness?.toFixed(3)],
                                    ["Kurtosis", info.kurtosis?.toFixed(3)],
                                    ["Outliers", `${info.outliers?.count ?? 0} (${(info.outliers?.percentage ?? 0).toFixed(1)}%)`],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex justify-between">
                                        <span className="text-muted-foreground">{label}</span>
                                        <span className="font-semibold text-right">{value ?? "—"}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-1.5">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">{info.shape}</span>
                                {info.normality_test && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${info.normality_test.is_normal ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                                        {info.normality_test.is_normal ? "Normal" : "Not Normal"} (p={info.normality_test.p_value?.toFixed(3)})
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hypothesis Testing */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FlaskConical className="w-5 h-5 text-purple-400" /> Hypothesis Testing</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-muted-foreground font-medium">Column 1 (required)</label>
                            <div className="relative mt-1">
                                <select value={col1} onChange={e => setCol1(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                                    {allCols.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground font-medium">Column 2 (optional — enables 2-sample tests)</label>
                            <div className="relative mt-1">
                                <select value={col2} onChange={e => setCol2(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                                    <option value="">— Single column test —</option>
                                    {allCols.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <button onClick={runHypothesis} disabled={hypoLoading || !col1}
                            className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60">
                            {hypoLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Running...</> : <><Play className="w-4 h-4" /> Run Test</>}
                        </button>
                        {hypoResult && (
                            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto">
                                {Object.entries(hypoResult).map(([test, res]) => (
                                    <div key={test} className={`p-3 rounded-lg ${res.significant ? "bg-green-500/10 border border-green-500/30" : "bg-white/5"}`}>
                                        <p className="text-xs font-bold mb-1">{res.test || test}</p>
                                        {res.error ? <p className="text-xs text-red-400">{res.error}</p> : (
                                            <>
                                                {res.statistic !== undefined && <p className="text-xs text-muted-foreground">Statistic: <span className="text-foreground">{res.statistic?.toFixed(4)}</span></p>}
                                                {res.p_value !== undefined && <p className="text-xs text-muted-foreground">p-value: <span className={res.significant ? "text-green-400" : "text-red-400"}>{res.p_value?.toFixed(4)}</span></p>}
                                                {res.correlation !== undefined && <p className="text-xs text-muted-foreground">Correlation: <span className="text-blue-400">{res.correlation?.toFixed(4)}</span></p>}
                                                {res.interpretation && <p className="text-xs mt-1 text-foreground">{res.interpretation}</p>}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Anomaly Detection */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 rounded-xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-400" /> Anomaly Detection</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-muted-foreground font-medium">Detection Method</label>
                            <div className="relative mt-1">
                                <select value={anomalyMethod} onChange={e => setAnomalyMethod(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                                    <option value="isolation_forest">Isolation Forest (ML-based)</option>
                                    <option value="statistical">Statistical (Z-score)</option>
                                    <option value="dbscan">DBSCAN Clustering</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground font-medium">Contamination Rate: {contamination}</label>
                            <input type="range" min="0.01" max="0.3" step="0.01" value={contamination} onChange={e => setContamination(parseFloat(e.target.value))}
                                className="w-full mt-1 accent-primary" />
                            <div className="flex justify-between text-[10px] text-muted-foreground"><span>1%</span><span>30%</span></div>
                        </div>
                        <button onClick={runAnomaly} disabled={anomalyLoading}
                            className="w-full py-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60">
                            {anomalyLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Detecting...</> : <><Zap className="w-4 h-4" /> Detect Anomalies</>}
                        </button>
                        {anomalyResult && (
                            <div className="mt-3 p-4 rounded-lg bg-white/5 space-y-2">
                                {anomalyResult.error ? <p className="text-xs text-red-400">{anomalyResult.error}</p> : (
                                    <>
                                        <p className="text-xs text-muted-foreground">Method: <span className="text-foreground">{anomalyResult.method}</span></p>
                                        <div className="flex gap-4">
                                            <div>
                                                <p className="text-3xl font-bold text-orange-400">{anomalyResult.total_anomalies}</p>
                                                <p className="text-xs text-muted-foreground">Anomalies Found</p>
                                            </div>
                                            <div>
                                                <p className="text-3xl font-bold text-red-400">{(anomalyResult.anomaly_percentage ?? 0).toFixed(1)}%</p>
                                                <p className="text-xs text-muted-foreground">of Dataset</p>
                                            </div>
                                        </div>
                                        {anomalyResult.total_anomalies === 0 && (
                                            <div className="flex items-center gap-2 text-green-400 text-sm"><CheckCircle2 className="w-4 h-4" /> No anomalies detected</div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
