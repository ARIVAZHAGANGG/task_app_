import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

const StatsCard = ({ title, value, icon: Icon, trend, color, index = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="saas-card p-6 flex items-center gap-6 group hover:translate-y-[-4px]"
        >
            <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                color === 'primary' ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" :
                    color === 'success' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                        color === 'warning' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                            "bg-red-500/10 text-red-600 dark:text-red-400"
            )}>
                <Icon size={28} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1">{title}</p>
                <div className="flex items-baseline gap-3">
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{value}</h3>
                    {trend && (
                        <span className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                            trend.startsWith("+") ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                        )}>
                            {trend}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default StatsCard;

