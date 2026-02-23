import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    AreaChart,
    Area
} from 'recharts';

interface ChartDataItem {
    [key: string]: string | number;
}

interface ChartProps {
    config: {
        type: string;
        title: string;
        xLabel?: string;
        yLabel?: string;
    };
    data: ChartDataItem[];
}

const ChartRenderer: React.FC<ChartProps> = ({ config, data }) => {
    const renderChart = () => {
        switch (config.type) {
            case 'bar':
                return (
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey={config.xLabel || ""}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                color: '#0f172a'
                            }}
                        />
                        <Bar
                            dataKey={config.yLabel || ""}
                            fill="url(#barGradient)"
                            radius={[6, 6, 0, 0]}
                            barSize={40}
                        />
                    </BarChart>
                );

            case 'area':
                return (
                    <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey={config.xLabel || ""}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey={config.yLabel || ""}
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fill="url(#areaGradient)"
                        />
                    </AreaChart>
                );

            default:
                return <div className="flex items-center justify-center h-full text-slate-400">Chart type not supported</div>;
        }
    };

    return (
        <div className="glass-card p-8 flex flex-col h-[400px]">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">{config.title}</h3>
            </div>
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ChartRenderer;
