import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Wind, ShieldCheck, Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { toast } from "sonner";
import { useGoogleLogin } from "@react-oauth/google";

const Register = () => {
    // Separate state for first/last name
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    // Auth state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const { register, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!termsAccepted) {
            toast.error("Please accept the Terms & Conditions.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        setIsLoading(true);
        try {
            // Combine names for backend compatibility
            const fullName = `${firstName} ${lastName}`.trim();
            await register({ name: fullName, email, password });
            toast.success("Account created successfully!");
            navigate("/");
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            try {
                await googleLogin(tokenResponse.access_token);
                toast.success("Signed in with Google!");
                navigate("/");
            } catch (error) {
                toast.error("Google sign-up failed.");
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => toast.error("Google Sign-Up failed."),
    });

    return (
        <div className="min-h-screen flex bg-[#fdfcf8]">
            {/* Left Side - Branding & Motto (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-[#f5f5f4] flex-col items-center justify-center p-12 text-center">
                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#fdfcf8] via-[#f5f5f4] to-[#e7e5e4] opacity-80"></div>

                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#a8a29e_1px,transparent_1px)] [background-size:16px_16px]"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 mb-8 bg-white rounded-3xl shadow-sm flex items-center justify-center border border-[#e7e5e4] overflow-hidden p-4">
                        <img src="/assets/logo.png" alt="ZenTask Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-[#44403c] mb-3 font-serif">
                        ZEN TASK
                    </h1>
                    <p className="text-lg font-medium tracking-wide text-[#78716c] mb-8">
                        Focus. Execute. Dominate.
                    </p>
                    <div className="max-w-md">
                        <p className="text-[#a8a29e] font-light text-sm italic leading-relaxed">
                            "Stay focused. Achieve your goals. One task at a time."
                        </p>
                    </div>
                </div>

                <div className="absolute bottom-8 text-[#d6d3d1] text-xs tracking-widest uppercase">
                    v2.0.0
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
                <div className="w-full max-w-[480px]">
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Link to="/login" className="text-[#a8a29e] hover:text-[#78716c] transition-colors">
                                <ArrowLeft size={18} />
                            </Link>
                            <h2 className="text-3xl font-bold text-[#292524] tracking-tight">Create an account</h2>
                        </div>
                        <p className="text-[#78716c] ml-7">Start your productivity journey today.</p>
                    </div>

                    <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-[#f5f5f4]">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="First Name"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className="bg-[#fcfbf9] border-[#e7e5e4] focus:border-[#d6d3d1] focus:ring-[#d6d3d1]/20 text-[#44403c] placeholder-transparent h-12"
                                />
                                <Input
                                    label="Last Name"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="bg-[#fcfbf9] border-[#e7e5e4] focus:border-[#d6d3d1] focus:ring-[#d6d3d1]/20 text-[#44403c] placeholder-transparent h-12"
                                />
                            </div>

                            <Input
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-[#fcfbf9] border-[#e7e5e4] focus:border-[#d6d3d1] focus:ring-[#d6d3d1]/20 text-[#44403c] placeholder-transparent h-12"
                            />

                            <Input
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-[#fcfbf9] border-[#e7e5e4] focus:border-[#d6d3d1] focus:ring-[#d6d3d1]/20 text-[#44403c] placeholder-transparent h-12"
                            />

                            <Input
                                label="Confirm Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="bg-[#fcfbf9] border-[#e7e5e4] focus:border-[#d6d3d1] focus:ring-[#d6d3d1]/20 text-[#44403c] placeholder-transparent h-12"
                            />

                            <div className="flex items-center space-x-2 cursor-pointer mt-2">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="w-4 h-4 rounded border-[#d6d3d1] text-[#78716c] focus:ring-[#d6d3d1]/50"
                                    required
                                />
                                <span className="text-xs text-[#78716c]">
                                    I agree to the <span className="font-semibold text-[#57534e]">Terms & Conditions</span>
                                </span>
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-4 text-sm font-bold tracking-wide text-[#44403c] bg-gradient-to-r from-[#e7e5e4] to-[#d6d3d1] hover:from-[#d6d3d1] hover:to-[#c7c2be] shadow-lg shadow-[#d6d3d1]/20 border-none transition-all duration-300 rounded-xl flex items-center justify-center gap-2 mt-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Creating Account...</span>
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#f5f5f4]"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold text-[#a8a29e]">
                                <span className="bg-white px-3">or</span>
                            </div>
                        </div>

                        {/* Google Button */}
                        <Button
                            variant="secondary"
                            className="w-full py-3.5 bg-white text-[#57534e] hover:bg-[#fafaf9] border border-[#e7e5e4] font-medium rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                            onClick={handleGoogleLogin}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span className="opacity-90">Continue with Google</span>
                        </Button>
                    </div>

                    <p className="mt-8 text-center text-[#78716c] text-sm">
                        Already have an account?{" "}
                        <Link to="/login" className="text-[#57534e] hover:text-[#292524] font-bold transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
