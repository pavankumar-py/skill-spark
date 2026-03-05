import { motion } from "framer-motion";
import { FileText, Users, TrendingUp, Trophy } from "lucide-react";
import { mockAssessments, mockCandidates, scoreDistributionData, assessmentsOverTimeData, participationData } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";

const stats = [
  { label: "Total Assessments", value: mockAssessments.length, icon: FileText, color: "text-primary" },
  { label: "Candidates Attempted", value: mockCandidates.length, icon: Users, color: "text-primary" },
  { label: "Average Score", value: Math.round(mockCandidates.reduce((a, c) => a + c.totalScore, 0) / mockCandidates.length), icon: TrendingUp, color: "text-primary" },
  { label: "Top Score", value: Math.max(...mockCandidates.map((c) => c.totalScore)), icon: Trophy, color: "text-primary" },
];

const Dashboard = () => (
  <div className="p-6 max-w-7xl mx-auto space-y-6">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
      <p className="text-muted-foreground text-sm">Overview of your hiring assessments</p>
    </motion.div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</span>
            <s.icon className={`h-4 w-4 ${s.color}`} />
          </div>
          <p className="text-3xl font-bold">{s.value}</p>
        </motion.div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium mb-4">Score Distribution</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={scoreDistributionData}>
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
          <LineChart data={assessmentsOverTimeData}>
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

export default Dashboard;
