import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

const ThemeSwitcher = () => {
    const { theme, setThemeMode } = useTheme();

    const themes = [
        { id: "light", icon: Sun, label: "Light" },
        { id: "dark", icon: Moon, label: "Dark" },
        { id: "amoled", icon: Smartphone, label: "AMOLED" },
    ];

    return (
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 transition-colors">
            {themes.map(({ id, icon: Icon, label }) => (
                <button
                    key={id}
                    onClick={() => setThemeMode(id)}
                    className={cn(
                        "relative p-1.5 rounded-full transition-all group",
                        theme === id ? "text-blue-600 dark:text-blue-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    )}
                    title={`Switch to ${id} mode`}
                >
                    {theme === id && (
                        <motion.div
                            layoutId="activeTheme"
                            className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full shadow-sm"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    )}
                    <Icon size={16} className="relative z-10" />
                </button>
            ))}
        </div>
    );
};

export default ThemeSwitcher;
