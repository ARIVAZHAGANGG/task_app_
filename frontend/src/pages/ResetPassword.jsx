import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/auth/resetpassword/${token}`, { password });
            setSuccess(true);
            toast.success("Password reset successfully!");
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid or expired token");
            toast.error(err.response?.data?.message || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fdfcf8] flex">
            {/* Left Side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 bg-[#fdfcf8] relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#f5f5f4_0%,_transparent_100%)] opacity-60"></div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <div className="w-24 h-24 mb-8 bg-white rounded-3xl shadow-sm flex items-center justify-center border border-[#e7e5e4] p-4">
                        <img src="/assets/logo.png" alt="ZenTask Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-5xl font-bold text-stone-800 mb-6 tracking-tight leading-tight">
                        Secure Your <br />
                        <span className="text-stone-400">Account.</span>
                    </h1>
                    <p className="text-xl text-stone-600 leading-relaxed max-w-md">
                        Create a strong password to keep your tasks and data safe.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white lg:rounded-l-[3rem] shadow-2xl shadow-stone-200/50">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-stone-800 tracking-tight">Set New Password</h2>
                        <p className="mt-2 text-stone-500">Please enter your new password below.</p>
                    </div>

                    {success ? (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center animate-fade-in">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-green-800 mb-2">Password Reset!</h3>
                            <p className="text-green-700 mb-6">Redirecting to login...</p>
                            <Link
                                to="/login"
                                className="inline-flex items-center text-sm font-semibold text-green-700 hover:text-green-800"
                            >
                                <ArrowLeft size={16} className="mr-2" /> Login Now
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">New Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-stone-400 group-focus-within:text-stone-800 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full pl-11 pr-12 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-200 focus:border-stone-400 outline-none transition-all font-medium text-stone-800 placeholder-stone-400 group-hover:bg-stone-100/50"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Confirm Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-stone-400 group-focus-within:text-stone-800 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-200 focus:border-stone-400 outline-none transition-all font-medium text-stone-800 placeholder-stone-400 group-hover:bg-stone-100/50"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-stone-800 to-stone-700 hover:from-stone-900 hover:to-stone-800 text-white rounded-xl font-bold shadow-lg shadow-stone-300/30 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>

                            <div className="text-center">
                                <Link to="/login" className="inline-flex items-center text-sm font-semibold text-stone-500 hover:text-stone-800 transition-colors">
                                    <ArrowLeft size={16} className="mr-2" /> Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
