import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-card border-2 border-foreground p-6 space-y-4">
          <h2 className="font-display text-xl text-foreground text-center">LOGIN</h2>

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
                placeholder="••••••••"
                required
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-3 bg-primary text-primary-foreground border-2 border-foreground font-mono text-sm flex items-center justify-center gap-2 hover-brutal",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center mt-4 font-mono text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
