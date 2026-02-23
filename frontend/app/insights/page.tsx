"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lightbulb, AlertTriangle, TrendingUp, BarChart2, Database, CheckCircle2, Link2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface Recommendation { type: string; priority: "high" | "medium" | "low"; message: string; }
interface Correlation { variable_1: string; variable_2: string; correlation: number; strength: string; }
interface InsightsData {
    ai_summary: string;
    recommendations: Recommendation[];
    anomalies: Record<string, { outlier_count: number; outlier_percentage: number; has_outliers: boolean }>;
    correlations: { strong_correlations?: Correlation[]; weak_correlations?: Correlation[]; message?: string };
    categorical_analysis: Record<string, { unique_values: number; most_frequent: string; top_5_values: Record<string, number> }>;
    dataset_overview: { total_rows: number; total_columns: number; missing_percentage: number; duplicate_rows: number };
}

const PRIORITY_COLORS: Record<string, string> = {
    high: "border-red-500/50 bg-red-500/10 text-red-400",
    medium: "border-orange-500/50 bg-orange-500/10 text-orange-400",
    low: "border-blue-500/50 bg-blue-500/10 text-blue-400",
};

export default function InsightsPage() {
    const [data, setData] = useState<InsightsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API}/insights`)
            .then(r => { if (!r.ok) throw new Error("No insights yet"); return r.json(); })
            .then(setData)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error || !data) return (
        <div className="space-y-4">
            <h1 className="text-4xl font-bold"><span className="gradient-text">AI Insights</span></h1>
            <div className="glass-card p-8 rounded-xl text-center">
                <Lightbulb className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <p className="text-orange-400 font-semibold">{error || "No data"}</p>
                <p className="text-muted-foreground mt-2">Please upload a dataset first.</p>
            </div>
        </div>
    );

    const strongCorrs = data.correlations?.strong_correlations || [];
    const outlierCols = Object.entries(data.anomalies || {}).filter(([, v]) => v.has_outliers);

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-bold mb-2"><span className="gradient-text">AI Insights</span></h1>
                <p className="text-muted-foreground text-lg">Automated analysis and actionable recommendations powered by AI</p>
            </motion.div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Rows", value: data.dataset_overview?.total_rows ?? "—", icon: Database, color: "from-blue-500 to-cyan-500" },
                    { label: "Columns", value: data.dataset_overview?.total_columns ?? "—", icon: BarChart2, color: "from-purple-500 to-pink-500" },
                    { label: "Missing %", value: `${(data.dataset_overview?.missing_percentage ?? 0).toFixed(2)}%`, icon: AlertTriangle, color: "from-orange-500 to-red-500" },
                    { label: "Duplicates", value: data.dataset_overview?.duplicate_rows ?? 0, icon: CheckCircle2, color: "from-green-500 to-emerald-500" },
                ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-5 rounded-xl">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-2xl font-bold">{String(s.value)}</p>
                            <p className="text-sm text-muted-foreground">{s.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* AI Summary */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-xl border border-primary/20">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold mb-2">AI Summary</h2>
                        <p className="text-muted-foreground leading-relaxed">{data.ai_summary}</p>
                    </div>
                </div>
            </motion.div>

            {/* Recommendations */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-xl">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" /> Recommendations</h2>
                {data.recommendations.length === 0 ? (
                    <div className="flex items-center gap-2 text-green-400"><CheckCircle2 className="w-5 h-5" /> Dataset looks great! No major issues found.</div>
                ) : (
                    <div className="space-y-3">
                        {data.recommendations.map((rec, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                                className={`p-4 rounded-lg border ${PRIORITY_COLORS[rec.priority] || PRIORITY_COLORS.low}`}>
                                <div className="flex items-start gap-3">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[rec.priority]}`}>{rec.priority}</span>
                                    <p className="text-sm leading-relaxed text-foreground">{rec.message}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Strong Correlations */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 rounded-xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Link2 className="w-5 h-5 text-blue-400" /> Strong Correlations</h2>
                    {strongCorrs.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{data.correlations?.message || "No strong correlations found."}</p>
                    ) : (
                        <div className="space-y-3">
                            {strongCorrs.slice(0, 8).map((c, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                    <span className="text-sm font-medium">{c.variable_1} ↔ {c.variable_2}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${c.correlation > 0 ? "bg-blue-500" : "bg-red-500"}`}
                                                style={{ width: `${Math.abs(c.correlation) * 100}%` }} />
                                        </div>
                                        <span className={`text-sm font-bold w-14 text-right ${c.correlation > 0 ? "text-blue-400" : "text-red-400"}`}>
                                            {c.correlation.toFixed(3)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Outlier Summary */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6 rounded-xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-400" /> Outlier Summary</h2>
                    {outlierCols.length === 0 ? (
                        <div className="flex items-center gap-2 text-green-400"><CheckCircle2 className="w-5 h-5" /> No significant outliers detected</div>
                    ) : (
                        <div className="space-y-3">
                            {outlierCols.slice(0, 8).map(([col, info]) => (
                                <div key={col} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                    <span className="text-sm font-medium truncate">{col}</span>
                                    <div className="flex items-center gap-2 text-sm text-right">
                                        <span className="text-orange-400 font-bold">{info.outlier_count}</span>
                                        <span className="text-muted-foreground">({(info.outlier_percentage ?? 0).toFixed(1)}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Categorical Analysis */}
                {Object.keys(data.categorical_analysis || {}).length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6 rounded-xl lg:col-span-2">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-pink-400" /> Categorical Analysis</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(data.categorical_analysis).slice(0, 6).map(([col, info]) => (
                                <div key={col} className="p-4 rounded-lg bg-white/5">
                                    <h3 className="font-semibold text-sm mb-2 truncate">{col}</h3>
                                    <p className="text-xs text-muted-foreground mb-3">{info.unique_values} unique values · Most common: <span className="text-primary">{info.most_frequent}</span></p>
                                    <div className="space-y-1.5">
                                        {Object.entries(info.top_5_values || {}).slice(0, 4).map(([val, count]) => {
                                            const maxCount = Math.max(...Object.values(info.top_5_values || {}));
                                            return (
                                                <div key={val}>
                                                    <div className="flex justify-between text-xs mb-0.5">
                                                        <span className="truncate max-w-[70%]">{val}</span>
                                                        <span className="text-muted-foreground">{count}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
