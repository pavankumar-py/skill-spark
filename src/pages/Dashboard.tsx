import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Users, TrendingUp, Trophy, FilePlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";

const Dashboard = () => {
  const { companyId } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalAssessments: 0, totalCandidates: 0, avgScore: 0, topScore: 0 });
  const [scoreData, setScoreData] = useState<{ range: string; count: number }[]>([]);
  const [assessmentTimeline, setAssessmentTimeline] = useState<{ month: string; count: number }[]>([]);
  const [participationData, setParticipationData] = useState<{ month: string; candidates: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      const { data: assessments } = await supabase.from("assessments").select("id, created_at").eq("company_id", companyId);
      const totalAssessments = assessments?.length || 0;

      const assessmentIds = assessments?.map((a) => a.id) || [];
      let totalCandidates = 0;
      let avgScore = 0;
      let topScore = 0;
      const scores: number[] = [];

      if (assessmentIds.length > 0) {
        const { data: candidates } = await supabase.from("candidates").select("id, assessment_id, created_at").in("assessment_id", assessmentIds);
        totalCandidates = candidates?.length || 0;

        const candidateIds = candidates?.map((c) => c.id) || [];
        if (candidateIds.length > 0) {
          const { data: candidateScores } = await supabase.from("candidate_scores").select("total_score").in("candidate_id", candidateIds);
          candidateScores?.forEach((s) => { if (s.total_score != null) scores.push(Number(s.total_score)); });
          if (scores.length > 0) {
            avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            topScore = Math.max(...scores);
          }
        }

        const monthMap: Record<string, number> = {};
        candidates?.forEach((c) => {
          const m = new Date(c.created_at).toLocaleString("en", { month: "short", year: "2-digit" });
          monthMap[m] = (monthMap[m] || 0) + 1;
        });
        setParticipationData(Object.entries(monthMap).map(([month, candidates]) => ({ month, candidates })));
      }

      const ranges = [
        { range: "0-20", min: 0, max: 20 },
        { range: "21-40", min: 21, max: 40 },
        { range: "41-60", min: 41, max: 60 },
        { range: "61-80", min: 61, max: 80 },
        { range: "81-100", min: 81, max: 100 },
      ];
      setScoreData(ranges.map((r) => ({ range: r.range, count: scores.filter((s) => s >= r.min && s <= r.max).length })));

      const aMonthMap: Record<string, number> = {};
      assessments?.forEach((a) => {
        const m = new Date(a.created_at).toLocaleString("en", { month: "short", year: "2-digit" });
        aMonthMap[m] = (aMonthMap[m] || 0) + 1;
      });
      setAssessmentTimeline(Object.entries(aMonthMap).map(([month, count]) => ({ month, count })));

      setStats({ totalAssessments, totalCandidates, avgScore, topScore });
      setLoading(false);
    };

    fetchData();
  }, [companyId]);

  const statCards = [
    { label: "Total Assessments", value: stats.totalAssessments, icon: FileText },
    { label: "Candidates Attempted", value: stats.totalCandidates, icon: Users },
    { label: "Average Score", value: stats.avgScore, icon: TrendingUp },
    { label: "Top Score", value: stats.topScore, icon: Trophy },
  ];

  if (loading) return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-4 w-64" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-lg" /><Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );

  // Empty state
  if (stats.totalAssessments === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm mb-8">Overview of your hiring assessments</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 text-center max-w-lg mx-auto">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FilePlus className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No assessments yet</h2>
          <p className="text-muted-foreground text-sm mb-6">Create your first assessment to start evaluating candidates with AI-powered questions.</p>
          <Button onClick={() => navigate("/app/create")}>Create Assessment <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your hiring assessments</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</span>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-bold">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-medium mb-4">Assessments Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={assessmentTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-medium mb-4">Candidate Participation Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={participationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="candidates" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
