import { useState, useEffect } from "react";
import { LayoutDashboard, CheckCircle2, Clock, TrendingUp, Calendar, Zap, Activity } from "lucide-react";
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
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
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
            className="p-8 max-w-7xl mx-auto transition-colors duration-300 space-y-10"
        >
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 saas-gradient rounded-[2rem] shadow-xl shadow-indigo-500/20 flex items-center justify-center transition-transform hover:rotate-6">
                        <LayoutDashboard className="w-8 h-8 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">System <span className="text-indigo-600">Overview</span></h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Your productivity mission, visualized in real-time.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700 saas-shadow">
                    <div className="px-6 py-2.5 bg-slate-900 dark:bg-slate-700/50 rounded-xl flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Global Server Time</span>
                            <span className="text-lg font-bold text-white mt-1 font-mono tracking-tighter">
                                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                <span className="animate-pulse opacity-50 ml-1">:</span>
                                {currentTime.toLocaleTimeString('en-US', { second: '2-digit' })}
                            </span>
                        </div>
                        <Calendar className="text-slate-400" size={20} />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* AI Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    <AIInsightsCard />
                </div>
                <div className="lg:col-span-4">
                    <GamificationCard />
                </div>
            </div>

            <div className="saas-card p-2 overflow-hidden shadow-none border-none bg-transparent">
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

