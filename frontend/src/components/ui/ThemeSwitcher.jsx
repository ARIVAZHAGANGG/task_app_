import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

const ThemeSwitcher = () => {
    const { theme, setThemeMode } = useTheme();

    const themes = [
        { id: "light", icon: Sun, label: "Light" },
        { id: "dark", icon: Moon, label: "Dark" },
        { id: "amoled", icon: Smartphone, label: "AMOLED" },
    ];

    return (
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700">
            {themes.map(({ id, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => setThemeMode(id)}
                    className={`relative p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors ${theme === id ? "text-primary-600 dark:text-primary-400" : ""
                        }`}
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
