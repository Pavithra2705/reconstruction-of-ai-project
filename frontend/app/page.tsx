"use client";

import { motion } from "framer-motion";
import { Database, Upload, Sparkles, BarChart3, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const stats = [
    { label: "Datasets Processed", value: "0", icon: Database, color: "from-blue-500 to-cyan-500" },
    { label: "Data Cleaned", value: "0 MB", icon: Sparkles, color: "from-purple-500 to-pink-500" },
    { label: "Charts Generated", value: "0", icon: BarChart3, color: "from-orange-500 to-red-500" },
    { label: "Insights Found", value: "0", icon: TrendingUp, color: "from-green-500 to-emerald-500" },
  ];

  const quickActions = [
    {
      title: "Upload Dataset",
      description: "Start by uploading your CSV, Excel, or JSON file",
      href: "/upload",
      icon: Upload,
      gradient: "from-primary to-secondary",
    },
    {
      title: "Clean Data",
      description: "Remove duplicates, handle missing values, and more",
      href: "/clean",
      icon: Sparkles,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Visualize",
      description: "Create beautiful, interactive charts and dashboards",
      href: "/visualize",
      icon: BarChart3,
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-2">
          Welcome to <span className="gradient-text">DATAVERSE AI</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          AI-Powered Data Analysis, Cleaning, and Visualization Platform
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card p-6 rounded-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-card p-6 rounded-xl cursor-pointer group"
                >
                  <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                  <p className="text-muted-foreground">{action.description}</p>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Getting Started */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="glass-card p-8 rounded-xl"
      >
        <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">1</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Upload Your Data</h3>
              <p className="text-muted-foreground">Support for CSV, Excel, JSON, and Parquet files up to 100MB</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">2</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Clean & Transform</h3>
              <p className="text-muted-foreground">Automatically detect and fix data quality issues</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">3</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Visualize & Analyze</h3>
              <p className="text-muted-foreground">Generate insights and beautiful charts with AI assistance</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
