import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight, Lock, Eye, EyeOff, RefreshCw, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = "password" | "magic-link" | "change-password";
type Step = "credentials" | "check-email";
type ChangeMode = "know-password" | "send-link";

const RESEND_COOLDOWN = 30; // seconds

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sendOtp, signInWithPassword, user } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [step, setStep] = useState<Step>("credentials");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Change Password state
  const [changeMode, setChangeMode] = useState<ChangeMode>("know-password");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  // Listen for recovery state or query params
  useEffect(() => {
    // Check URL params or hash for recovery
    const type = searchParams.get("type");
    if (type === "recovery" || window.location.hash.includes("type=recovery")) {
      setIsRecovery(true);
      setAuthMode("change-password");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        setAuthMode("change-password");
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams]);

  // Redirect if logged in (unless recovering password)
  useEffect(() => {
    if (user && !isRecovery) {
      navigate("/");
    }
  }, [user, isRecovery, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
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

  const handleSendMagicLink = useCallback(async (e?: React.FormEvent) => {
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
        title: "Failed to send link",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Link sent! 📧",
        description: "Check your email for the verification link",
      });
      setStep("check-email");
      setResendCooldown(RESEND_COOLDOWN);
    }

    setLoading(false);
  }, [email, sendOtp, toast]);

  // Handle changing password if user knows current password
  const handleChangeWithCurrentPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!currentPassword) {
      toast({
        title: "Current password required",
        description: "Please enter your current password.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "New password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: "Incorrect current password",
          description: "Verification failed. Check your current password.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 2. Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast({
          title: "Failed to update password",
          description: updateError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Changed! 🎉",
          description: "Your password has been updated. You can now log in.",
        });
        setAuthMode("password");
        setPassword(newPassword);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle sending password reset email link
  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?type=recovery`,
      });

      if (error) {
        toast({
          title: "Failed to send reset link",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset link sent! 📧",
          description: "Check your email for the password reset link",
        });
        setStep("check-email");
        setResendCooldown(RESEND_COOLDOWN);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle setting a new password after arriving from recovery email
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "New password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "Failed to reset password",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Reset Successful! 🎉",
          description: "Your new password is set. Welcome to CampusConnect!",
        });
        setIsRecovery(false);
        navigate("/");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    if (resendCooldown > 0) return;
    if (authMode === "change-password" && changeMode === "send-link") {
      await handleSendResetLink({ preventDefault: () => {} } as any);
    } else {
      await handleSendMagicLink();
    }
  };

  const switchToPassword = () => {
    setAuthMode("password");
    setStep("credentials");
  };

  const switchToMagicLink = () => {
    setAuthMode("magic-link");
    setStep("credentials");
    setPassword("");
  };

  const switchToChangePassword = () => {
    setAuthMode("change-password");
    setStep("credentials");
  };

  const resetToEmail = () => {
    setStep("credentials");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary mx-auto mb-4 flex items-center justify-center border-2 border-foreground shadow-brutal hover:rotate-6 transition-transform">
            <span className="font-display text-2xl text-primary-foreground">CC</span>
          </div>
          <h1 className="font-display text-3xl text-foreground">
            CAMPUS<span className="text-primary">CONNECT</span>
          </h1>
          <p className="font-mono text-sm text-muted-foreground mt-2">TSDC Edition</p>
        </div>

        {step === "credentials" ? (
          <div className="bg-card border-2 border-foreground p-6 space-y-4 shadow-brutal-lime">
            <h2 className="font-display text-xl text-foreground text-center">
              {authMode === "change-password" ? "CHANGE PASSWORD" : "LOGIN"}
            </h2>

            {/* Auth Mode Toggle */}
            <div className="flex border-2 border-foreground">
              <button
                type="button"
                onClick={switchToPassword}
                className={cn(
                  "flex-1 py-2 font-mono text-xs transition-colors",
                  authMode === "password"
                    ? "bg-primary text-primary-foreground font-bold"
                    : "bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                PASSWORD
              </button>
              <button
                type="button"
                onClick={switchToMagicLink}
                className={cn(
                  "flex-1 py-2 font-mono text-xs transition-colors border-l-2 border-r-2 border-foreground",
                  authMode === "magic-link"
                    ? "bg-primary text-primary-foreground font-bold"
                    : "bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                MAGIC LINK
              </button>
              <button
                type="button"
                onClick={switchToChangePassword}
                className={cn(
                  "flex-1 py-2 font-mono text-xs transition-colors",
                  authMode === "change-password"
                    ? "bg-secondary text-secondary-foreground font-bold"
                    : "bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                RESET / CHANGE
              </button>
            </div>

            {/* PASSWORD LOGIN MODE */}
            {authMode === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
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

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-xs text-muted-foreground">PASSWORD</label>
                    <button
                      type="button"
                      onClick={switchToChangePassword}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
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
                      LOGGING IN...
                    </>
                  ) : (
                    <>
                      LOGIN
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MAGIC LINK MODE */}
            {authMode === "magic-link" && (
              <form onSubmit={handleSendMagicLink} className="space-y-4">
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
                      SENDING LINK...
                    </>
                  ) : (
                    <>
                      SEND LINK
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* CHANGE / RESET PASSWORD MODE */}
            {authMode === "change-password" && (
              <div className="space-y-4">
                {isRecovery ? (
                  /* Form for setting new password when redirected from recovery email */
                  <form onSubmit={handleSetNewPassword} className="space-y-4">
                    <div className="p-3 bg-primary/10 border-2 border-primary text-center">
                      <ShieldCheck className="w-6 h-6 text-primary mx-auto mb-1" />
                      <p className="font-mono text-xs font-bold text-primary">RECOVERY MODE DETECTED</p>
                      <p className="font-mono text-[10px] text-muted-foreground">Enter a new password for your account</p>
                    </div>

                    <div>
                      <label className="font-mono text-xs text-muted-foreground">NEW PASSWORD</label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="w-full pl-10 pr-12 py-3 bg-background border-2 border-foreground font-mono text-sm text-foreground focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-mono text-xs text-muted-foreground">CONFIRM NEW PASSWORD</label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type={showConfirmNewPassword ? "text" : "password"}
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="w-full pl-10 pr-12 py-3 bg-background border-2 border-foreground font-mono text-sm text-foreground focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-secondary text-secondary-foreground border-2 border-foreground font-mono text-sm flex items-center justify-center gap-2 hover-brutal disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          SETTING NEW PASSWORD...
                        </>
                      ) : (
                        <>
                          SET NEW PASSWORD
                          <KeyRound className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <>
                    {/* Sub-mode selector: Know Password vs Forgot/Send Link */}
                    <div className="flex border-2 border-foreground text-[10px]">
                      <button
                        type="button"
                        onClick={() => setChangeMode("know-password")}
                        className={cn(
                          "flex-1 py-2 font-mono transition-colors",
                          changeMode === "know-password"
                            ? "bg-secondary text-secondary-foreground font-bold"
                            : "bg-background text-muted-foreground hover:text-foreground"
                        )}
                      >
                        I KNOW CURRENT PASSWORD
                      </button>
                      <button
                        type="button"
                        onClick={() => setChangeMode("send-link")}
                        className={cn(
                          "flex-1 py-2 font-mono transition-colors border-l-2 border-foreground",
                          changeMode === "send-link"
                            ? "bg-secondary text-secondary-foreground font-bold"
                            : "bg-background text-muted-foreground hover:text-foreground"
                        )}
                      >
                        DON'T KNOW (SEND LINK)
                      </button>
                    </div>

                    {/* MODE 1: KNOW CURRENT PASSWORD */}
                    {changeMode === "know-password" && (
                      <form onSubmit={handleChangeWithCurrentPassword} className="space-y-3">
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
                              className="w-full pl-10 pr-4 py-2.5 bg-background border-2 border-foreground font-mono text-xs text-foreground focus:outline-none focus:border-secondary"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="font-mono text-xs text-muted-foreground">CURRENT PASSWORD</label>
                          <div className="relative mt-1">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              className="w-full pl-10 pr-10 py-2.5 bg-background border-2 border-foreground font-mono text-xs text-foreground focus:outline-none focus:border-secondary"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="font-mono text-xs text-muted-foreground">NEW PASSWORD</label>
                          <div className="relative mt-1">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              minLength={6}
                              className="w-full pl-10 pr-10 py-2.5 bg-background border-2 border-foreground font-mono text-xs text-foreground focus:outline-none focus:border-secondary"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="font-mono text-xs text-muted-foreground">CONFIRM NEW PASSWORD</label>
                          <div className="relative mt-1">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type={showConfirmNewPassword ? "text" : "password"}
                              value={confirmNewPassword}
                              onChange={(e) => setConfirmNewPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              minLength={6}
                              className="w-full pl-10 pr-10 py-2.5 bg-background border-2 border-foreground font-mono text-xs text-foreground focus:outline-none focus:border-secondary"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3 bg-secondary text-secondary-foreground border-2 border-foreground font-mono text-sm flex items-center justify-center gap-2 hover-brutal disabled:opacity-50 mt-2"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              UPDATING PASSWORD...
                            </>
                          ) : (
                            <>
                              UPDATE PASSWORD
                              <KeyRound className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* MODE 2: DON'T KNOW CURRENT PASSWORD (SEND LINK) */}
                    {changeMode === "send-link" && (
                      <form onSubmit={handleSendResetLink} className="space-y-4">
                        <p className="font-mono text-xs text-muted-foreground">
                          Enter your email address and we'll send you a password reset link.
                        </p>

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
                              className="w-full pl-10 pr-4 py-3 bg-background border-2 border-foreground font-mono text-sm text-foreground focus:outline-none focus:border-secondary"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3 bg-secondary text-secondary-foreground border-2 border-foreground font-mono text-sm flex items-center justify-center gap-2 hover-brutal disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              SENDING RESET LINK...
                            </>
                          ) : (
                            <>
                              SEND RESET LINK
                              <Mail className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Signup Link */}
            <div className="pt-4 border-t-2 border-foreground/20">
              <p className="font-mono text-xs text-muted-foreground text-center">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline font-bold">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        ) : (
          /* Check Email Step */
          <div className="bg-card border-2 border-foreground p-6 space-y-4 shadow-brutal-lime">
            <h2 className="font-display text-xl text-foreground text-center">CHECK EMAIL</h2>
            <div className="flex flex-col items-center py-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 border-2 border-primary">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <p className="font-mono text-sm text-center mb-2">
                We sent a link to:
              </p>
              <p className="font-mono text-sm text-primary font-bold text-center">
                {email}
              </p>
              <p className="font-mono text-xs text-muted-foreground text-center mt-4 max-w-[260px]">
                Click the link in the email to sign in or reset your password.
              </p>
            </div>

            {/* Resend Button */}
            <button
              type="button"
              onClick={handleResendLink}
              disabled={loading || resendCooldown > 0}
              className={cn(
                "w-full py-3 bg-background border-2 border-foreground font-mono text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors",
                resendCooldown > 0 ? "opacity-50 cursor-not-allowed" : ""
              )}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Link"}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={resetToEmail}
              className="w-full py-2 font-mono text-xs text-muted-foreground hover:text-foreground text-center"
            >
              ← Use different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
