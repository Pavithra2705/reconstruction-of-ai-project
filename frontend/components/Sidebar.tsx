"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Upload,
    Sparkles,
    BarChart3,
    LineChart,
    FlaskConical,
    Shuffle,
    MessageSquare,
    Database
} from "lucide-react";
import { motion } from "framer-motion";

const navigation = [
    { name: "Dashboard", href: "/", icon: Database },
    { name: "Upload", href: "/upload", icon: Upload },
    { name: "Clean", href: "/clean", icon: Sparkles },
    { name: "Insights", href: "/insights", icon: BarChart3 },
    { name: "Visualize", href: "/visualize", icon: LineChart },
    { name: "Advanced Stats", href: "/stats", icon: FlaskConical },
    { name: "Transform", href: "/transform", icon: Shuffle },
    { name: "AI Chat", href: "/chat", icon: MessageSquare },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 glass-card border-r border-white/10 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
                <Link href="/" className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Database className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold gradient-text">DATAVERSE</h1>
                        <p className="text-xs text-muted-foreground">AI Analytics</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="relative block"
                        >
                            <motion.div
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${isActive
                                        ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    }
                `}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>

                                {isActive && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute left-0 w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-r-full"
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <div className="glass px-4 py-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                        Powered by AI
                    </p>
                    <p className="text-sm font-medium mt-1">
                        v1.0.0
                    </p>
                </div>
            </div>
        </div>
    );
}
