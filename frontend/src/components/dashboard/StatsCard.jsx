import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

const StatsCard = ({ title, value, icon: Icon, trend, color, index = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-50 flex flex-col gap-6 group hover:shadow-md transition-all duration-300"
        >
            <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                color === 'primary' ? "bg-blue-50 text-blue-600" :
                    color === 'success' ? "bg-emerald-50 text-emerald-600" :
                        color === 'warning' ? "bg-orange-50 text-orange-600" :
                            "bg-rose-50 text-rose-600"
            )}>
                <Icon size={24} strokeWidth={2.5} />
            </div>

            <div className="space-y-1">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
                <div className="flex items-center gap-3">
                    <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{value}</h3>
                    {trend && (
                        <span className={cn(
                            "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider",
                            trend.startsWith("+") ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
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

