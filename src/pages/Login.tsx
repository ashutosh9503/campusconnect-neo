import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight, KeyRound, Lock, Eye, EyeOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthMode = "password" | "otp";
type Step = "credentials" | "otp-verify";

const RESEND_COOLDOWN = 30; // seconds

export default function Login() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp, signInWithPassword, user } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [step, setStep] = useState<Step>("credentials");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await signInWithPassword(email, password);

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back! 🎓",
        description: "Successfully logged in",
      });
      navigate("/");
    }

    setLoading(false);
  };

  const handleSendOtp = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await sendOtp(email);

    if (error) {
      toast({
        title: "Failed to send code",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Code sent! 📧",
        description: "Check your email for the 6-digit code",
      });
      setStep("otp-verify");
      setResendCooldown(RESEND_COOLDOWN);
    }

    setLoading(false);
  }, [email, sendOtp, toast]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;

    setLoading(true);
    const { error } = await verifyOtp(email, otpCode);

    if (error) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
      setOtpCode("");
    } else {
      toast({
        title: "Welcome! 🎓",
        description: "Successfully logged in",
      });
      navigate("/");
    }

    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    await handleSendOtp();
  };

  const switchToPassword = () => {
    setAuthMode("password");
    setStep("credentials");
    setOtpCode("");
  };

  const switchToOtp = () => {
    setAuthMode("otp");
    setStep("credentials");
    setPassword("");
  };

  const resetToEmail = () => {
    setStep("credentials");
    setOtpCode("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary mx-auto mb-4 flex items-center justify-center border-2 border-foreground">
            <span className="font-display text-2xl text-primary-foreground">CC</span>
          </div>
          <h1 className="font-display text-3xl text-foreground">
            CAMPUS<span className="text-primary">CONNECT</span>
          </h1>
          <p className="font-mono text-sm text-muted-foreground mt-2">TSDC Edition</p>
        </div>

        {step === "credentials" ? (
          <div className="bg-card border-2 border-foreground p-6 space-y-4">
            <h2 className="font-display text-xl text-foreground text-center">LOGIN</h2>

            {/* Auth Mode Toggle */}
            <div className="flex border-2 border-foreground">
              <button
                type="button"
                onClick={switchToPassword}
                className={cn(
                  "flex-1 py-2 font-mono text-xs transition-colors",
                  authMode === "password"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                PASSWORD
              </button>
              <button
                type="button"
                onClick={switchToOtp}
                className={cn(
                  "flex-1 py-2 font-mono text-xs transition-colors border-l-2 border-foreground",
                  authMode === "otp"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                OTP
              </button>
            </div>

            <form onSubmit={authMode === "password" ? handlePasswordLogin : handleSendOtp} className="space-y-4">
              {/* Email */}
              <div>
                <label className="font-mono text-xs text-muted-foreground">EMAIL</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-background border-2 border-foreground font-mono text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Password (only in password mode) */}
              {authMode === "password" && (
                <div>
                  <label className="font-mono text-xs text-muted-foreground">PASSWORD</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-12 py-3 bg-background border-2 border-foreground font-mono text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full py-3 bg-primary text-primary-foreground border-2 border-foreground font-mono text-sm flex items-center justify-center gap-2 hover-brutal",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {authMode === "password" ? "LOGGING IN..." : "SENDING..."}
                  </>
                ) : (
                  <>
                    {authMode === "password" ? "LOGIN" : "SEND OTP"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Signup Link */}
            <div className="pt-4 border-t-2 border-foreground/20">
              <p className="font-mono text-xs text-muted-foreground text-center">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        ) : (
          /* OTP Verification Form */
          <form onSubmit={handleVerifyOtp} className="bg-card border-2 border-foreground p-6 space-y-4">
            <h2 className="font-display text-xl text-foreground text-center">ENTER CODE</h2>
            <p className="font-mono text-xs text-muted-foreground text-center">
              We sent a 6-digit code to
              <br />
              <span className="text-primary">{email}</span>
            </p>

            {/* OTP Input */}
            <div className="flex justify-center py-4">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="border-2 border-foreground bg-background" />
                  <InputOTPSlot index={1} className="border-2 border-foreground bg-background" />
                  <InputOTPSlot index={2} className="border-2 border-foreground bg-background" />
                  <InputOTPSlot index={3} className="border-2 border-foreground bg-background" />
                  <InputOTPSlot index={4} className="border-2 border-foreground bg-background" />
                  <InputOTPSlot index={5} className="border-2 border-foreground bg-background" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className={cn(
                "w-full py-3 bg-primary text-primary-foreground border-2 border-foreground font-mono text-sm flex items-center justify-center gap-2 hover-brutal",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  VERIFYING...
                </>
              ) : (
                <>
                  VERIFY & LOGIN
                  <KeyRound className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={resetToEmail}
              className="w-full py-2 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              ← Use different email
            </button>

            {/* Resend Button */}
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading || resendCooldown > 0}
              className={cn(
                "w-full py-2 font-mono text-xs flex items-center justify-center gap-1",
                resendCooldown > 0
                  ? "text-muted-foreground cursor-not-allowed"
                  : "text-primary hover:underline"
              )}
            >
              {resendCooldown > 0 ? (
                `Resend code in ${resendCooldown}s`
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Resend code
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
