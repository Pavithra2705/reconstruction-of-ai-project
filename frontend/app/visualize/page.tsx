"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ComposedChart,
} from "recharts";
import {
    LineChart as LineChartIcon, BarChart2, TrendingUp, Database, Download, MessageSquare, Send,
    X, Cpu, Sparkles, Activity, AlertTriangle, CheckCircle2, ChevronRight, PieChart as PieIcon,
    Layers, Target, Zap, Grid
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface KPI { label: string; value: string; icon: React.ElementType; color: string; change?: string }
interface Message { role: "user" | "ai"; content: string }
interface DashboardData {
    metrics: Record<string, string>;
    trends: { id: number; value: number }[];
    category_data: { name: string; value: number }[];
    summary: Record<string, string | number>;
    quality: Record<string, string | number>;
    num_cols: string[];
    cat_cols: string[];
}
interface InsightsData {
    ai_summary: string;
    recommendations: { priority: string; message: string }[];
    dataset_overview: { total_rows: number; total_columns: number; missing_percentage: number };
}

const CHART_COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4"];

const TABS = [
    { id: "overview", label: "Overview", icon: Grid },
    { id: "trends", label: "Trends", icon: TrendingUp },
    { id: "distribution", label: "Distribution", icon: Layers },
    { id: "comparison", label: "Comparison", icon: Target },
];

export default function VisualizePage() {
    const [dash, setDash] = useState<DashboardData | null>(null);
    const [insights, setInsights] = useState<InsightsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", content: "Hello! Ask me anything about your dataset." }
    ]);
    const [chatInput, setChatInput] = useState("");
    const [chatTyping, setChatTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        Promise.all([
            fetch(`${API}/dashboard`).then(r => r.ok ? r.json() : null),
            fetch(`${API}/insights`).then(r => r.ok ? r.json() : null),
        ]).then(([d, i]) => {
            setDash(d); setInsights(i);
        }).catch(e => setError(e.message)).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, chatTyping]);

    const sendChat = async (text?: string) => {
        const msg = text ?? chatInput.trim();
        if (!msg) return;
        setMessages(m => [...m, { role: "user", content: msg }]);
        setChatInput(""); setChatTyping(true);
        try {
            const res = await fetch(`${API}/chat`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msg }),
            });
            const data = await res.json();
            setMessages(m => [...m, { role: "ai", content: data.reply }]);
        } catch {
            setMessages(m => [...m, { role: "ai", content: "Connection error. Please check backend." }]);
        } finally { setChatTyping(false); }
    };

    const downloadReport = () => { window.open(`${API}/report`, "_blank"); };

    const metricEntries = dash?.metrics ? Object.entries(dash.metrics) : [];
    const metricIcons = [Database, BarChart2, TrendingUp, Activity];
    const metricColors = [
        "from-blue-500 to-cyan-400",
        "from-purple-500 to-pink-400",
        "from-green-500 to-emerald-400",
        "from-orange-500 to-yellow-400",
    ];

    const kpis: KPI[] = metricEntries.map(([key, value], i) => ({
        label: key.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        value: String(value),
        icon: metricIcons[i % metricIcons.length],
        color: metricColors[i % metricColors.length],
    }));

    // Generate derived chart data from available data
    const scatterData = dash?.trends?.map((t, i) => ({
        x: t.id,
        y: t.value,
        z: Math.abs(Math.sin(i) * 100),
    })) ?? [];

    const radarData = dash?.category_data?.slice(0, 6).map(d => ({
        subject: d.name.length > 8 ? d.name.slice(0, 8) + "…" : d.name,
        value: d.value,
        fullMark: Math.max(...(dash?.category_data?.map(x => x.value) ?? [1])),
    })) ?? [];

    const composedData = dash?.trends?.slice(0, 20).map((t, i) => ({
        name: `${t.id}`,
        area: t.value,
        bar: Math.abs(t.value * 0.7),
        line: t.value * 1.1,
    })) ?? [];

    const pieData = dash?.category_data?.slice(0, 6) ?? [];

    const tooltipStyle = {
        background: "#1e1e2e",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "8px",
        fontSize: "12px",
        color: "#fff"
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
        </div>
    );

    if (error || !dash) return (
        <div className="space-y-4">
            <h1 className="text-4xl font-bold"><span className="gradient-text">Visualize</span></h1>
            <div className="glass-card p-10 rounded-xl text-center">
                <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <p className="text-orange-400 font-semibold text-lg">{error || "No data available"}</p>
                <p className="text-muted-foreground mt-2">Upload a dataset first to see your dashboard.</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold mb-2"><span className="gradient-text">Visualize</span></h1>
                    <p className="text-muted-foreground">Interactive analytics dashboard with AI-driven insights</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setChatOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-sm font-medium transition">
                        <MessageSquare className="w-4 h-4 text-primary" /> AI Chat
                    </button>
                    <button onClick={downloadReport}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold hover:opacity-90 transition">
                        <Download className="w-4 h-4" /> Download Report
                    </button>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="glass-card p-5 rounded-xl hover:ring-1 hover:ring-primary/30 transition group cursor-default">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                            </div>
                            <p className="text-2xl font-bold mb-1">{kpi.value}</p>
                            <p className="text-sm text-muted-foreground">{kpi.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* AI Summary Banner */}
            {insights?.ai_summary && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="glass-card p-5 rounded-xl border border-primary/20">
                    <div className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold mb-1 text-primary">AI Analysis</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{insights.ai_summary}</p>
                            {insights.recommendations?.slice(0, 2).map((rec, i) => (
                                <span key={i} className={`inline-flex items-center gap-1 mt-2 mr-2 text-[10px] px-2.5 py-1 rounded-full font-semibold ${rec.priority === "high" ? "bg-red-500/20 text-red-300" : rec.priority === "medium" ? "bg-orange-500/20 text-orange-300" : "bg-blue-500/20 text-blue-300"}`}>
                                    {rec.priority === "high" ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                    {rec.priority.toUpperCase()}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-white/10 pb-0">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 -mb-px ${activeTab === tab.id ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                            <Icon className="w-4 h-4" />{tab.label}
                        </button>
                    );
                })}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Area Chart */}
                    {dash.trends.length > 0 && (
                        <div className="glass-card p-6 rounded-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <LineChartIcon className="w-5 h-5 text-blue-400" />
                                <h2 className="font-bold">Trend Analysis</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={dash.trends} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="id" tick={{ fill: "#6b7280", fontSize: 11 }} />
                                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fill="url(#grad1)" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Bar Chart */}
                    {dash.category_data.length > 0 && (
                        <div className="glass-card p-6 rounded-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart2 className="w-5 h-5 text-pink-400" />
                                <h2 className="font-bold">Category Breakdown</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={dash.category_data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#ec4899" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#a855f7" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} />
                                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="value" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Pie Chart */}
                    {pieData.length > 0 && (
                        <div className="glass-card p-6 rounded-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <PieIcon className="w-5 h-5 text-emerald-400" />
                                <h2 className="font-bold">Proportion View</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Legend wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Scatter Chart */}
                    {scatterData.length > 0 && (
                        <div className="glass-card p-6 rounded-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                <h2 className="font-bold">Scatter Distribution</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <ScatterChart margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="x" name="Index" tick={{ fill: "#6b7280", fontSize: 11 }} />
                                    <YAxis dataKey="y" name="Value" tick={{ fill: "#6b7280", fontSize: 11 }} />
                                    <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
                                    <Scatter data={scatterData} fill="#f59e0b" opacity={0.7} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </motion.div>
            )}

            {/* TRENDS TAB */}
            {activeTab === "trends" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Line Chart */}
                    {dash.trends.length > 0 && (
                        <div className="glass-card p-6 rounded-xl lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-cyan-400" />
                                <h2 className="font-bold">Line Trend</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={dash.trends} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="id" tick={{ fill: "#6b7280", fontSize: 11 }} />
                                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: "#06b6d4", r: 3 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Composed Chart */}
                    {composedData.length > 0 && (
                        <div className="glass-card p-6 rounded-xl lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <Layers className="w-5 h-5 text-purple-400" />
                                <h2 className="font-bold">Combined Chart (Area + Bar + Line)</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={250}>
                                <ComposedChart data={composedData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} />
                                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Legend wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }} />
                                    <Area type="monotone" dataKey="area" fill="url(#areaGrad)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                    <Bar dataKey="bar" fill="#ec4899" opacity={0.7} radius={[2, 2, 0, 0]} />
                                    <Line type="monotone" dataKey="line" stroke="#10b981" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </motion.div>
            )}

            {/* DISTRIBUTION TAB */}
            {activeTab === "distribution" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Donut */}
                    {pieData.length > 0 && (
                        <div className="glass-card p-6 rounded-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <PieIcon className="w-5 h-5 text-emerald-400" />
                                <h2 className="font-bold">Donut Chart</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={4}>
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Legend wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Full Pie */}
                    {pieData.length > 0 && (
                        <div className="glass-card p-6 rounded-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <PieIcon className="w-5 h-5 text-orange-400" />
                                <h2 className="font-bold">Full Pie Chart</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Scatter */}
                    {scatterData.length > 0 && (
                        <div className="glass-card p-6 rounded-xl lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                <h2 className="font-bold">Scatter Plot</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={260}>
                                <ScatterChart margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="x" name="Index" tick={{ fill: "#6b7280", fontSize: 11 }} />
                                    <YAxis dataKey="y" name="Value" tick={{ fill: "#6b7280", fontSize: 11 }} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Scatter data={scatterData} fill="#f59e0b" opacity={0.8} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </motion.div>
            )}

            {/* COMPARISON TAB */}
            {activeTab === "comparison" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Radar Chart */}
                    {radarData.length > 0 && (
                        <div className="glass-card p-6 rounded-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-5 h-5 text-indigo-400" />
                                <h2 className="font-bold">Radar Chart</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={260}>
                                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={90}>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                    <PolarRadiusAxis tick={{ fill: "#6b7280", fontSize: 9 }} />
                                    <Radar name="Value" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} strokeWidth={2} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Horizontal Bar */}
                    {dash.category_data.length > 0 && (
                        <div className="glass-card p-6 rounded-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart2 className="w-5 h-5 text-teal-400" />
                                <h2 className="font-bold">Horizontal Bar</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={dash.category_data} layout="vertical" margin={{ top: 4, right: 20, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} />
                                    <YAxis type="category" dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} width={70} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {dash.category_data.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Stacked Bar */}
                    {dash.category_data.length > 0 && (
                        <div className="glass-card p-6 rounded-xl lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <Layers className="w-5 h-5 text-pink-400" />
                                <h2 className="font-bold">Multi-Color Bar Comparison</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={dash.category_data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} />
                                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                        {dash.category_data.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Dataset Quality */}
            {insights && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: "Total Records", value: insights.dataset_overview?.total_rows?.toLocaleString() ?? "—", icon: Database, color: "text-blue-400" },
                            { label: "Total Features", value: insights.dataset_overview?.total_columns ?? "—", icon: BarChart2, color: "text-purple-400" },
                            { label: "Missing Data", value: `${(insights.dataset_overview?.missing_percentage ?? 0).toFixed(2)}%`, icon: AlertTriangle, color: "text-orange-400" },
                        ].map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <div key={i} className="glass-card p-4 rounded-xl flex items-center gap-4">
                                    <Icon className={`w-8 h-8 ${s.color}`} />
                                    <div>
                                        <p className="text-xl font-bold">{String(s.value)}</p>
                                        <p className="text-xs text-muted-foreground">{s.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* AI Chat Slide-In */}
            <AnimatePresence>
                {chatOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-40" onClick={() => setChatOpen(false)} />
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
                            className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col bg-[#0d0d1a] border-l border-white/10 shadow-2xl">
                            <div className="p-4 border-b border-white/10 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                    <Cpu className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm">AI Data Analyst</h3>
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /><span className="text-xs text-muted-foreground">Online</span></div>
                                </div>
                                <button onClick={() => setChatOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                        {m.role === "ai" && <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"><Cpu className="w-3.5 h-3.5 text-white" /></div>}
                                        <div className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${m.role === "user" ? "bg-gradient-to-br from-primary to-secondary text-white rounded-br-sm" : "glass text-foreground rounded-bl-sm"}`}>
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                                {chatTyping && (
                                    <div className="flex justify-start">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mr-2"><Cpu className="w-3.5 h-3.5 text-white" /></div>
                                        <div className="glass px-3.5 py-2.5 rounded-xl rounded-bl-sm flex gap-1 items-center">
                                            {[0, 0.2, 0.4].map(d => <div key={d} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />)}
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="p-4 border-t border-white/10 flex gap-2">
                                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === "Enter" && sendChat()}
                                    placeholder="Ask about your data..." className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                                <button onClick={() => sendChat()} disabled={!chatInput.trim() || chatTyping}
                                    className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center hover:opacity-90 disabled:opacity-40">
                                    <Send className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
