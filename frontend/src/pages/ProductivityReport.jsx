import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, Target, Award, Calendar, ChevronRight, FileText, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'sonner';

const ProductivityReport = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/gamification/stats');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch report stats");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleDownloadReport = async () => {
        setIsGenerating(true);
        try {
            const response = await api.get('/gamification/report/download', {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ZenTask_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);

            toast.success("Productivity Report Downloaded!", {
                icon: <Download className="text-green-500" />
            });
        } catch (err) {
            console.error("Download failed:", err);
            toast.error("Failed to generate PDF report");
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
    );

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-slide-up">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Productivity <span className="text-primary-600">Report</span></h1>
                    <p className="text-slate-500 font-bold mt-1">Deep analysis of your performance metrics</p>
                </div>
                <button
                    onClick={handleDownloadReport}
                    disabled={isGenerating}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                    {isGenerating ? "FORGING PDF..." : "DOWNLOAD FULL REPORT"}
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="md:col-span-2 saas-card p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-2 text-primary-600">
                            <TrendingUp size={24} />
                            <span className="font-black uppercase tracking-widest text-sm">Productivity Score</span>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <span className="text-8xl font-black text-slate-900 dark:text-white">{stats?.points > 0 ? (stats.level * 15 + 65) % 100 : 0}</span>
                            <span className="text-2xl font-black text-slate-400">/ 100</span>
                        </div>
                        <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(stats?.level * 15 + 65) % 100}%` }}
                                className="h-full saas-gradient"
                            />
                        </div>
                        <p className="text-slate-500 font-bold max-w-md">
                            Your performance is in the top <span className="text-indigo-600">5%</span> this week. Excellent streak maintenance and task prioritization.
                        </p>
                    </div>
                </div>

                {/* Level Detail */}
                <div className="saas-card p-10 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-24 h-24 rounded-3xl saas-gradient flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40">
                        <Award size={48} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white">Level {stats?.level}</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">{stats?.points} Total XP</p>
                    </div>
                    <div className="badge badge-primary">Elite Performer</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Activity Highlights */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <Target className="text-primary-600" />
                        Key Highlights
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: "Tasks Completed", value: stats?.totalTasksDone || 0, color: "text-green-600", bg: "bg-green-50" },
                            { label: "Current Streak", value: `${stats?.streak} Days`, color: "text-amber-600", bg: "bg-amber-50" },
                            { label: "Focus Efficiency", value: "94%", color: "text-indigo-600", bg: "bg-indigo-50" }
                        ].map((item, i) => (
                            <div key={i} className={`flex items-center justify-between p-6 ${item.bg} dark:bg-opacity-5 rounded-3xl border border-slate-100 dark:border-slate-800`}>
                                <span className="font-bold text-slate-600 dark:text-slate-400">{item.label}</span>
                                <span className={`text-xl font-black ${item.color}`}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Insights Card */}
                <div className="saas-card p-10 bg-slate-900 border-none relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-3 text-indigo-400">
                            <Sparkles size={24} />
                            <h3 className="text-2xl font-black text-white">AI Observations</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-1 h-12 bg-indigo-500 rounded-full shrink-0" />
                                <p className="text-slate-300 font-medium">
                                    You are most productive between <span className="text-white font-bold">9:00 AM and 11:30 AM</span>. Consider scheduling high-focus tasks during this window.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1 h-12 bg-indigo-500 rounded-full shrink-0" />
                                <p className="text-slate-300 font-medium">
                                    Your completion rate for <span className="text-white font-bold">Coding</span> tasks has increased by <span className="text-green-400 font-bold">12%</span> since last week.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={() => navigate('/analytics')}
                                className="flex items-center gap-2 text-indigo-400 font-black text-sm uppercase tracking-widest hover:text-white transition-colors group"
                            >
                                View Full Analysis
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductivityReport;
