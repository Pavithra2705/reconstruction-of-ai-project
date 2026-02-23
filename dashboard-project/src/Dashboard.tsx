import React, { useState, useEffect } from 'react';
import ChartRenderer from './components/ChartRenderer';
import {
  BarChart3,
  LayoutDashboard,
  Database,
  Activity,
  MessageSquare,
  ChevronRight,
  Download,
  FileText,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  X,
  Send
} from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState('Corporate Executive');
  const [data, setData] = useState<any>(null);
  const [, setInsights] = useState<any>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: "Hello! I am your Auto Analyst AI Assistant. I've analyzed your dataset and prepared some insights. How can I help you today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchInsights();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/dashboard');
      const result = await response.json();
      if (result.status !== 'no_data') {
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/insights');
      const result = await response.json();
      setInsights(result);
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: { role: 'user' | 'ai', content: string } = { role: 'user', content: inputText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputText })
      });
      const result = await response.json();
      const aiMessage: { role: 'user' | 'ai', content: string } = { role: 'ai', content: result.reply };
      setMessages([...newMessages, aiMessage]);
    } catch (error) {
      const errorMessage: { role: 'user' | 'ai', content: string } = { role: 'ai', content: "I'm sorry, I'm having trouble connecting to the logic engine." };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      window.open('http://127.0.0.1:8000/report', '_blank');
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const themes = ['Corporate Executive', 'Dark Analytics', 'Startup Modern', 'Minimal White'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100">
      {/* Refined Top Navigation */}
      <nav className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 fixed top-0 w-full z-40">
        <div className="max-w-[1600px] mx-auto h-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                AutoDash <span className="text-indigo-600">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Premium Intelligence</span>
            </div>
          </div>

          {/* Theme Switcher from Image */}
          <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            {themes.map((theme) => (
              <button
                key={theme}
                onClick={() => setActiveTheme(theme)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTheme === theme
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200 ring-1 ring-slate-100'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {theme === 'Corporate Executive' && <LayoutDashboard className="w-3.5 h-3.5" />}
                {theme === 'Dark Analytics' && <Activity className="w-3.5 h-3.5" />}
                {theme === 'Startup Modern' && <TrendingUp className="w-3.5 h-3.5" />}
                {theme === 'Minimal White' && <FileText className="w-3.5 h-3.5" />}
                {theme}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors relative">
              <MessageSquare className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <button
              onClick={handleDownloadReport}
              className="premium-button flex items-center gap-2 !px-4 !py-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 pt-20">
        {/* Left Metrics Sidebar - Image Inspired */}
        <aside className="metrics-sidebar custom-scrollbar">
          {[
            { label: 'AVERAGE UNIT PRICE', value: data?.metrics?.AVERAGE_UNIT_PRICE || '59,870.02', trend: '+4.2%', icon: LayoutDashboard, status: 'up' },
            { label: 'TOTAL BRAND COUNT', value: data?.metrics?.TOTAL_BRAND_COUNT || '19', trend: '0%', icon: Database, status: 'neutral' },
            { label: 'MARKET LEADER', value: data?.metrics?.MARKET_LEADER || 'Dell/Lenovo', trend: '+2.5%', icon: Activity, status: 'up' },
            { label: 'DATA HEALTH', value: data?.metrics?.DATA_HEALTH || '98.5%', trend: '+0.5%', icon: AlertCircle, status: 'up' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 min-h-[140px] flex flex-col justify-between"
            >
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
              </div>
              <div className="flex items-center justify-end mt-4">
                <span className={`trend-badge ${stat.status === 'up' ? 'trend-up' : stat.status === 'down' ? 'trend-down' : 'trend-neutral'
                  }`}>
                  {stat.status === 'up' && '↑'}
                  {stat.status === 'down' && '↓'}
                  {stat.trend}
                </span>
              </div>
            </motion.div>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 transition-all duration-500 overflow-y-auto ${isChatOpen ? 'mr-[400px]' : 'mr-0'}`}>
          <div className="p-8 lg:p-12 space-y-10">
            {/* Header / Insight Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-10 !bg-gradient-to-br from-white to-slate-50 border-none shadow-xl"
            >
              <div className="flex gap-8 items-start">
                <div className="flex-1 space-y-6">
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Analyzing the latest market data showing significant variance driven by high-end performance rigs.
                    Premium brands maintain high price floors, while volume leaders provide the highest quantity of options.
                  </p>
                  <div className="flex gap-4">
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100 flex items-center gap-2">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Key Trend: Market Consolidation
                    </span>
                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" />
                      Performance: +18% YoY
                    </span>
                  </div>
                </div>
                {/* Secondary Chart or Info would go here */}
              </div>
            </motion.div>

            {/* Charts Grid - High Resolution Style */}
            <div className="grid grid-cols-2 gap-8">
              {data?.charts?.map((chart: any) => (
                <div key={chart.id} className="relative group">
                  <ChartRenderer
                    config={{ type: chart.type, title: chart.title, xLabel: chart.xKey, yLabel: chart.yKey }}
                    data={chart.data}
                  />
                  <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-white/80 backdrop-blur rounded-lg shadow-sm border border-slate-200">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Fallback empty chart slots to match grid if no data */}
              {!data?.charts && [1, 2].map(i => (
                <div key={i} className="glass-card p-10 h-[400px] flex items-center justify-center border-dashed">
                  <div className="text-center text-slate-300">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Aggregating visual data...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* AI Assistant Side Panel (kept from previous version for functionality) */}
        <aside
          className={`fixed top-20 right-0 h-[calc(100vh-80px)] bg-white border-l border-slate-200 shadow-2xl transition-all duration-500 z-30 flex flex-col ${isChatOpen ? 'w-[400px]' : 'w-0'}`}
        >
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col h-full"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">AI Assistant</h4>
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online</span>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                      : 'bg-slate-100 text-slate-900'
                      }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 p-4 rounded-2xl">
                      <div className="flex gap-1 text-[10px]">Thinking...</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-white">
                <div className="relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about your data..."
                    className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </aside>

        {/* Floating Toggle Button */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
          >
            <MessageSquare className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;