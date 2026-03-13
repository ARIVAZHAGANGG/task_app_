import { useState, useEffect } from "react";
import { LayoutDashboard, CheckCircle2, Clock, TrendingUp, Calendar, Zap, Activity, Sun } from "lucide-react";
import api from "../services/api";
import StatsCard from "../components/dashboard/StatsCard";
import AnalyticsCharts from "../components/dashboard/AnalyticsCharts";
import AIInsightsCard from "../components/dashboard/AIInsightsCard";
import GamificationCard from "../components/dashboard/GamificationCard";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Dashboard = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [graphData, setGraphData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, graphRes, analyticsRes] = await Promise.all([
                    api.get("/tasks/stats"),
                    api.get("/tasks/graph-data"),
                    api.get("/tasks/analytics")
                ]);
                setStats(statsRes.data);
                setGraphData(graphRes.data);
                setAnalytics(analyticsRes.data);
            } catch (err) {
                toast.error("Failed to load dashboard analytics");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                </div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Initializing Control Center...</p>
            </div>
        );
    }

    // Prepare chart data
    const weeklyActivity = stats?.weeklyCompleted?.map(d => ({
        name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
        tasks: d.count
    })) || Array.from({ length: 7 }, (_, i) => ({ name: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i], tasks: 0 }));

    const priorityDist = graphData?.priorityDistribution || [
        { name: "High", value: 0 }, { name: "Medium", value: 0 }, { name: "Low", value: 0 }
    ];

    const trendData = graphData?.monthlyStats?.map(m => ({
        day: m.month,
        completed: m.completed
    })) || Array.from({ length: 7 }, (_, i) => ({ day: `Day ${i + 1}`, completed: 0 }));

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-10 max-w-[1600px] mx-auto transition-colors duration-300"
        >
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                        <img src="/assets/logo.png" alt="ZenTask" className="w-10 h-10 object-contain" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">Dashboard</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">System operational</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white dark:bg-slate-800 rounded-2xl p-1 shadow-sm border border-slate-100 dark:border-slate-700">
                        <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><Sun size={18} /></button>
                        <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><Clock size={18} /></button>
                        <div className="w-px h-5 bg-slate-100 mx-1"></div>
                        <button className="p-2.5 text-blue-600 bg-blue-50 rounded-xl transition-colors"><LayoutDashboard size={18} /></button>
                    </div>

                    <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-5 py-2.5 rounded-[20px] shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Time</span>
                            <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono tracking-tighter">
                                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                            </span>
                        </div>
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
                            <Calendar size={22} />
                        </div>
                    </div>
                </div>
            </header>

            <div className="mb-12">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                        <LayoutDashboard size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">System <span className="text-blue-600 dark:text-blue-400 font-medium">Overview</span></h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">Your productivity mission, visualized in real-time.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatsCard title="Total Objectives" value={stats?.totalTasks || 0} icon={Zap} color="primary" index={0} />
                    <StatsCard
                        title="Successful Completion"
                        value={stats?.completedTasks || 0}
                        icon={CheckCircle2}
                        trend={graphData?.completionPercentage ? `+${Math.round(graphData.completionPercentage)}%` : null}
                        color="success"
                        index={1}
                    />
                    <StatsCard title="Active Operations" value={stats?.pendingTasks || 0} icon={Activity} color="warning" index={2} />
                    <StatsCard
                        title="Efficiency Index"
                        value={graphData?.completionPercentage ? `${Math.round(graphData.completionPercentage)}%` : "0%"}
                        icon={TrendingUp}
                        color="danger"
                        index={3}
                    />
                </div>
            </div>

            {/* AI Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-12">
                    <AIInsightsCard />
                </div>
            </div>

            <div className="mt-10 p-2 overflow-hidden">
                <AnalyticsCharts
                    weeklyData={weeklyActivity}
                    priorityData={priorityDist}
                    trendData={trendData}
                />
            </div>
        </motion.div>
    );
};

export default Dashboard;
