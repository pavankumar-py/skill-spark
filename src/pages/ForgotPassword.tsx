import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">AssessKit</span>
        </div>

        {sent ? (
          <div className="glass-card p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Check your email</h2>
            <p className="text-muted-foreground text-sm mb-6">We've sent a password reset link to <strong>{email}</strong></p>
            <Link to="/login" className="text-sm text-primary hover:underline">Back to login</Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-1">Forgot password?</h2>
            <p className="text-muted-foreground mb-8">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
