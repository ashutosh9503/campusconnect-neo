import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function Login() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setStep("otp");
    }

    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    
    setLoading(true);

    const { error } = await verifyOtp(email, otpCode);

    if (error) {
      toast({
        title: "Invalid code",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome! 🎓",
        description: "Successfully logged in",
      });
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary mx-auto mb-4 flex items-center justify-center border-2 border-foreground">
            <span className="font-display text-2xl text-primary-foreground">CC</span>
          </div>
          <h1 className="font-display text-3xl text-foreground">CAMPUS<span className="text-primary">CONNECT</span></h1>
          <p className="font-mono text-sm text-muted-foreground mt-2">TSNDC Edition</p>
        </div>

        {step === "email" ? (
          /* Email Form */
          <form onSubmit={handleSendOtp} className="bg-card border-2 border-foreground p-6 space-y-4">
            <h2 className="font-display text-xl text-foreground text-center">LOGIN / SIGNUP</h2>
            <p className="font-mono text-xs text-muted-foreground text-center">
              Enter your email to receive a one-time code
            </p>

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
                  className="w-full pl-10 pr-4 py-3 bg-background border-2 border-foreground font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-3 bg-primary text-primary-foreground border-2 border-foreground font-mono text-sm flex items-center justify-center gap-2 hover-brutal",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? "SENDING..." : "SEND CODE"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* OTP Form */
          <form onSubmit={handleVerifyOtp} className="bg-card border-2 border-foreground p-6 space-y-4">
            <h2 className="font-display text-xl text-foreground text-center">ENTER CODE</h2>
            <p className="font-mono text-xs text-muted-foreground text-center">
              We sent a 6-digit code to<br />
              <span className="text-primary">{email}</span>
            </p>

            {/* OTP Input */}
            <div className="flex justify-center py-4">
              <InputOTP 
                maxLength={6} 
                value={otpCode} 
                onChange={setOtpCode}
              >
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className={cn(
                "w-full py-3 bg-primary text-primary-foreground border-2 border-foreground font-mono text-sm flex items-center justify-center gap-2 hover-brutal",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? "VERIFYING..." : "VERIFY & LOGIN"}
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Back */}
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtpCode("");
              }}
              className="w-full py-2 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              ← Use different email
            </button>

            {/* Resend */}
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full py-2 font-mono text-xs text-primary hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
