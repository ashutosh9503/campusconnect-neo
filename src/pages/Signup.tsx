import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, ArrowRight, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Stream = "CS" | "IT" | "EXTC" | "MECH" | "CIVIL" | "OTHER";
type Year = "FY" | "SY" | "TY" | "FINAL";

const streams: { value: Stream; label: string }[] = [
  { value: "CS", label: "Computer Science" },
  { value: "IT", label: "Information Technology" },
  { value: "EXTC", label: "Electronics & Telecom" },
  { value: "MECH", label: "Mechanical" },
  { value: "CIVIL", label: "Civil" },
  { value: "OTHER", label: "Other" },
];

const years: { value: Year; label: string }[] = [
  { value: "FY", label: "First Year" },
  { value: "SY", label: "Second Year" },
  { value: "TY", label: "Third Year" },
  { value: "FINAL", label: "Final Year" },
];

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stream, setStream] = useState<Stream>("CS");
  const [year, setYear] = useState<Year>("FY");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome to CampusConnect! 🎉",
        description: "Your account has been created",
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

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="bg-card border-2 border-foreground p-6 space-y-4">
          <h2 className="font-display text-xl text-foreground text-center">
            {step === 1 ? "CREATE ACCOUNT" : "SELECT YOUR INFO"}
          </h2>

          {/* Progress */}
          <div className="flex gap-2">
            <div className={cn("flex-1 h-1", step >= 1 ? "bg-primary" : "bg-muted")} />
            <div className={cn("flex-1 h-1", step >= 2 ? "bg-primary" : "bg-muted")} />
          </div>

          {step === 1 ? (
            <>
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

              {/* Password */}
              <div>
                <label className="font-mono text-xs text-muted-foreground">PASSWORD</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-12 py-3 bg-background border-2 border-foreground font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
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
            </>
          ) : (
            <>
              {/* Stream Selection */}
              <div>
                <label className="font-mono text-xs text-muted-foreground">SELECT STREAM</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {streams.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStream(s.value)}
                      className={cn(
                        "py-2 px-3 border-2 border-foreground font-mono text-xs transition-all",
                        stream === s.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-transparent text-foreground hover:bg-muted"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year Selection */}
              <div>
                <label className="font-mono text-xs text-muted-foreground">SELECT YEAR</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {years.map((y) => (
                    <button
                      key={y.value}
                      type="button"
                      onClick={() => setYear(y.value)}
                      className={cn(
                        "py-2 px-3 border-2 border-foreground font-mono text-xs transition-all",
                        year === y.value
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-transparent text-foreground hover:bg-muted"
                      )}
                    >
                      {y.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-3 bg-primary text-primary-foreground border-2 border-foreground font-mono text-sm flex items-center justify-center gap-2 hover-brutal",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading ? "CREATING ACCOUNT..." : step === 1 ? "CONTINUE" : "CREATE ACCOUNT"}
            <ArrowRight className="w-4 h-4" />
          </button>

          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              ← Back to credentials
            </button>
          )}
        </form>

        {/* Login Link */}
        <p className="text-center mt-4 font-mono text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
