import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Zap, CheckCircle2, BarChart3, Shield, Code, Brain, ArrowRight } from "lucide-react";

const features = [
  { icon: Brain, title: "AI-Powered Questions", desc: "Generate technical MCQs, numerical ability, and coding challenges automatically." },
  { icon: Code, title: "Live Code Editor", desc: "Candidates write and test code in a built-in editor with Python & JavaScript support." },
  { icon: Shield, title: "Anti-Cheat Monitoring", desc: "Tab-switch detection and activity monitoring to ensure assessment integrity." },
  { icon: BarChart3, title: "AI Evaluation & Reports", desc: "Get detailed scoring, code review, and AI-generated candidate summaries." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold">AssessKit</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/login">Sign in</Link></Button>
            <Button size="sm" asChild><Link to="/register">Get Started</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight">
            Hire smarter with<br />
            <span className="text-primary">AI-powered assessments</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Create coding challenges, aptitude tests, and evaluate candidates with AI — all in one platform.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button size="lg" asChild><Link to="/register">Start for Free <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/login">Sign In</Link></Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="glass-card p-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/50 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-10">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Create Assessment", desc: "Configure questions, difficulty, and duration in minutes." },
              { step: "2", title: "Share Link", desc: "Send candidates a unique assessment link — no signup needed for them." },
              { step: "3", title: "Review Results", desc: "Get AI-scored reports with detailed breakdowns and summaries." },
            ].map((s) => (
              <div key={s.step}>
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 font-bold">{s.step}</div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to hire better?</h2>
        <p className="text-muted-foreground mb-6">Create your first assessment in under 2 minutes.</p>
        <Button size="lg" asChild><Link to="/register">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span>AssessKit</span>
          </div>
          <span>© {new Date().getFullYear()} AssessKit. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
