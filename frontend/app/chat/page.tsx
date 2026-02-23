"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, Database, BarChart2, Users, Cpu, Sparkles } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface Message { role: "user" | "ai"; content: string; }
interface ColumnsData { columns: string[]; shape: { rows: number; columns: number }; numeric_columns: string[]; categorical_columns: string[] }

const SUGGESTED = [
    "Summarize this dataset for me",
    "What are the key trends and patterns?",
    "Which columns have the most issues?",
    "What would you recommend as next steps?",
    "Are there any unusual values I should look at?",
];

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", content: "Hello! I'm your AI Data Analyst. I can answer questions about your dataset, explain trends, and suggest actions. What would you like to know?" }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [colsData, setColsData] = useState<ColumnsData | null>(null);

    useEffect(() => {
        fetch(`${API}/columns`).then(r => r.ok ? r.json() : null).then(setColsData).catch(() => { });
    }, []);

    const sendMessage = async (text?: string) => {
        const msg = text ?? input.trim();
        if (!msg) return;
        const userMsg: Message = { role: "user", content: msg };
        setMessages(m => [...m, userMsg]);
        setInput("");
        setIsTyping(true);
        try {
            const res = await fetch(`${API}/chat`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msg }),
            });
            const data = await res.json();
            setMessages(m => [...m, { role: "ai", content: data.reply || "Sorry, I couldn't process that." }]);
        } catch {
            setMessages(m => [...m, { role: "ai", content: "I'm having trouble connecting to the AI engine. Please check the backend is running." }]);
        } finally { setIsTyping(false); }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Context Sidebar */}
            <div className="w-72 flex-shrink-0 space-y-4">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5 rounded-xl">
                    <h3 className="font-bold mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> Dataset Context</h3>
                    {colsData ? (
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Rows</span>
                                <span className="font-semibold">{colsData.shape.rows.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Columns</span>
                                <span className="font-semibold">{colsData.shape.columns}</span>
                            </div>
                            <div className="pt-2 border-t border-white/10">
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2"><BarChart2 className="w-3 h-3" /> Numeric ({colsData.numeric_columns.length})</p>
                                <div className="flex flex-wrap gap-1">
                                    {colsData.numeric_columns.slice(0, 6).map(c => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">{c}</span>)}
                                </div>
                            </div>
                            <div className="pt-2 border-t border-white/10">
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2"><Users className="w-3 h-3" /> Categorical ({colsData.categorical_columns.length})</p>
                                <div className="flex flex-wrap gap-1">
                                    {colsData.categorical_columns.slice(0, 6).map(c => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300">{c}</span>)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Upload a dataset to see context here.</p>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 rounded-xl">
                    <h3 className="font-bold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-400" /> Suggested Questions</h3>
                    <div className="space-y-2">
                        {SUGGESTED.map(s => (
                            <button key={s} onClick={() => sendMessage(s)}
                                className="w-full text-left text-xs p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground">
                                {s}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Chat Window */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 glass-card rounded-xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold">AI Data Analyst</h2>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-xs text-muted-foreground">Online · Powered by Groq</span>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            {msg.role === "ai" && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                                    <Cpu className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === "user"
                                    ? "bg-gradient-to-br from-primary to-secondary text-white rounded-br-sm"
                                    : "glass rounded-bl-sm text-foreground"
                                }`}>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mr-3">
                                <Cpu className="w-4 h-4 text-white" />
                            </div>
                            <div className="glass px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
                                {[0, 0.2, 0.4].map(d => (
                                    <div key={d} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex gap-3">
                        <input
                            type="text" value={input} onChange={e => setInput(e.target.value)}
                            onKeyPress={e => e.key === "Enter" && sendMessage()}
                            placeholder="Ask anything about your data..."
                            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                        />
                        <button onClick={() => sendMessage()} disabled={!input.trim() || isTyping}
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition">
                            <Send className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
