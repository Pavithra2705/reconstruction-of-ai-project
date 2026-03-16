"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, CheckCircle2, FileSpreadsheet, Table } from "lucide-react";
import Link from "next/link";

import { API_BASE } from "@/lib/api";

const API = API_BASE;

interface PreviewData {
    columns: string[];
    rows: Record<string, string | number | null>[];
    shape: { rows: number; columns: number };
}

export default function UploadPage() {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const fetchPreview = async () => {
        setPreviewLoading(true);
        try {
            const res = await fetch(`${API}/preview/raw`);
            if (!res.ok) throw new Error("Failed to fetch preview");
            setPreview(await res.json());
            setShowPreview(true);
        } catch (e) {
            console.error("Preview failed:", e);
        } finally {
            setPreviewLoading(false);
        }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            if (file.size > 100 * 1024 * 1024) {
                alert("File size exceeds 100MB limit");
                return;
            }
            setUploadedFile(file);
            setUploadSuccess(false);
            setPreview(null);
            setShowPreview(false);
            setUploading(true);

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(`${API}/upload`, {
                    method: 'POST',
                    body: formData,
                });
                if (response.ok) {
                    const result = await response.json();
                    console.log('Upload success:', result);
                    setUploadSuccess(true);
                    // Auto-fetch preview after successful upload
                    await fetchPreview();
                } else {
                    const errorData = await response.json();
                    alert(`Upload failed: ${errorData.message || response.statusText}`);
                }
            } catch (error) {
                console.error("Error uploading file:", error);
                const message = error instanceof Error ? error.message : String(error);
                alert(`Error connecting to the backend: ${message}`);
            } finally {
                setUploading(false);
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/json': ['.json'],
            'application/octet-stream': ['.parquet'],
        },
        multiple: false,
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-bold mb-2">
                    <span className="gradient-text">Upload Dataset</span>
                </h1>
                <p className="text-muted-foreground text-lg">
                    Upload your CSV, Excel, JSON, or Parquet file to get started
                </p>
            </motion.div>

            {/* Upload Area */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div
                    {...getRootProps()}
                    className={`glass-card p-12 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300
                        ${isDragActive ? "border-primary bg-primary/10 scale-[1.02]" : "border-white/20 hover:border-primary/50"}`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary ${isDragActive ? "scale-110" : ""} transition-transform duration-300`}>
                            <Upload className="w-10 h-10 text-white" />
                        </div>
                        {isDragActive ? (
                            <p className="text-xl font-semibold text-primary">Drop your file here...</p>
                        ) : (
                            <>
                                <p className="text-xl font-semibold">Drag & drop your file here</p>
                                <p className="text-muted-foreground">or click to browse</p>
                            </>
                        )}
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                            {['.csv', '.xlsx', '.xls', '.json', '.parquet'].map((ext) => (
                                <span key={ext} className="px-3 py-1 rounded-full glass text-xs font-medium">{ext}</span>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Maximum file size: 100MB</p>
                    </div>
                </div>
            </motion.div>

            {/* File Info */}
            {uploadedFile && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                <FileSpreadsheet className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{uploadedFile.name}</h3>
                                <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <div>
                            {uploading && (
                                <div className="flex items-center space-x-2 text-primary">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span>Uploading...</span>
                                </div>
                            )}
                            {uploadSuccess && !uploading && (
                                <div className="flex items-center space-x-2 text-green-500">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>Upload successful!</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {uploadSuccess && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-6 pt-6 border-t border-white/10">
                            <h4 className="font-semibold mb-4">Next Steps</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link href="/clean" className="glass-card p-4 rounded-lg hover:bg-white/10 transition-colors text-left block">
                                    <h5 className="font-semibold mb-1">Clean Data</h5>
                                    <p className="text-sm text-muted-foreground">Remove duplicates and handle missing values</p>
                                </Link>
                                <Link href="/insights" className="glass-card p-4 rounded-lg hover:bg-white/10 transition-colors text-left block">
                                    <h5 className="font-semibold mb-1">View Insights</h5>
                                    <p className="text-sm text-muted-foreground">Get statistical analysis and insights</p>
                                </Link>
                                <Link href="/visualize" className="glass-card p-4 rounded-lg hover:bg-white/10 transition-colors text-left block">
                                    <h5 className="font-semibold mb-1">Visualize</h5>
                                    <p className="text-sm text-muted-foreground">Create beautiful charts and dashboards</p>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* Dataset Preview */}
            {uploadSuccess && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Table className="w-5 h-5 text-blue-400" /> Dataset Preview
                        </h2>
                        <div className="flex items-center gap-3">
                            {preview && (
                                <span className="text-xs text-muted-foreground">
                                    Showing first {Math.min(preview.rows.length, 50)} of{" "}
                                    <span className="text-white font-semibold">{preview.shape.rows.toLocaleString()}</span> rows ×{" "}
                                    <span className="text-white font-semibold">{preview.shape.columns}</span> columns
                                </span>
                            )}
                            {showPreview && (
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-muted-foreground transition"
                                >
                                    Hide
                                </button>
                            )}
                            {!showPreview && (
                                <button
                                    onClick={fetchPreview}
                                    disabled={previewLoading}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition flex items-center gap-1.5 disabled:opacity-60"
                                >
                                    {previewLoading
                                        ? <><div className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" /> Loading...</>
                                        : <><Table className="w-3 h-3" /> Show Preview</>
                                    }
                                </button>
                            )}
                        </div>
                    </div>

                    {previewLoading && !preview && (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {showPreview && preview && (
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
                    )}
                </motion.div>
            )}

            {/* Supported Formats */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Supported File Formats</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { title: "CSV Files (.csv)", desc: "Comma-separated values, most common format" },
                        { title: "Excel Files (.xlsx, .xls)", desc: "Microsoft Excel spreadsheets" },
                        { title: "JSON Files (.json)", desc: "JavaScript Object Notation" },
                        { title: "Parquet Files (.parquet)", desc: "Columnar storage format for big data" },
                    ].map(({ title, desc }) => (
                        <div key={title} className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <h4 className="font-semibold">{title}</h4>
                                <p className="text-sm text-muted-foreground">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}