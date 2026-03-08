import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Brain, Code, Trophy, FileText, User, Mail, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface ReportData {
  candidate: { full_name: string; email: string; phone: string | null; started_at: string | null; completed_at: string | null };
  assessment: { title: string; role: string; tech_stack: string[]; experience_level: string | null };
  scores: { aptitude_score: number; coding_score: number; total_score: number; ai_summary: string };
  aptitudeResponses: { question_text: string; options: string[]; correct_answer: number; candidate_answer: number | null; is_correct: boolean }[];
  codingResponses: { title: string; description: string; code: string | null; language: string | null }[];
}

const CandidateReport = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!candidateId) return;
    const load = async () => {
      const [{ data: cand }, { data: score }] = await Promise.all([
        supabase.from("candidates").select("*").eq("id", candidateId).single(),
        supabase.from("candidate_scores").select("*").eq("candidate_id", candidateId).single(),
      ]);
      if (!cand) { setLoading(false); return; }

      const [{ data: assessment }, { data: responses }, { data: questions }] = await Promise.all([
        supabase.from("assessments").select("*").eq("id", cand.assessment_id).single(),
        supabase.from("candidate_responses").select("*").eq("candidate_id", candidateId),
        supabase.from("questions").select("*").eq("assessment_id", cand.assessment_id).order("sort_order"),
      ]);

      const aptitudeQs = (questions || []).filter((q) => q.type === "aptitude");
      const codingQs = (questions || []).filter((q) => q.type === "coding");

      const aptitudeResponses = aptitudeQs.map((q) => {
        const r = responses?.find((r) => r.question_id === q.id);
        let opts = q.options;
        if (typeof opts === "string") { try { opts = JSON.parse(opts); } catch { opts = []; } }
        return {
          question_text: q.question_text,
          options: Array.isArray(opts) ? opts as string[] : [],
          correct_answer: q.correct_answer ?? 0,
          candidate_answer: r?.answer_index ?? null,
          is_correct: r?.is_correct ?? false,
        };
      });

      const codingResponses = codingQs.map((q) => {
        const r = responses?.find((r) => r.question_id === q.id);
        return {
          title: q.coding_title || "Untitled",
          description: q.coding_description || "",
          code: r?.code_answer || null,
          language: r?.language || null,
        };
      });

      setReport({
        candidate: { full_name: cand.full_name, email: cand.email, phone: cand.phone, started_at: cand.started_at, completed_at: cand.completed_at },
        assessment: { title: assessment?.title || "", role: assessment?.role || "", tech_stack: assessment?.tech_stack || [], experience_level: assessment?.experience_level || null },
        scores: { aptitude_score: Number(score?.aptitude_score || 0), coding_score: Number(score?.coding_score || 0), total_score: Number(score?.total_score || 0), ai_summary: score?.ai_summary || "" },
        aptitudeResponses,
        codingResponses,
      });
      setLoading(false);
    };
    load();
  }, [candidateId]);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!report) return <div className="p-6 text-muted-foreground">Candidate not found.</div>;

  const { candidate, assessment, scores, aptitudeResponses, codingResponses } = report;
  const scoreColor = (s: number) => s >= 80 ? "text-green-500" : s >= 60 ? "text-yellow-500" : "text-destructive";
  const duration = candidate.started_at && candidate.completed_at
    ? Math.round((new Date(candidate.completed_at).getTime() - new Date(candidate.started_at).getTime()) / 60000)
    : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/app/evaluate")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Candidates
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{candidate.full_name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {candidate.email}</span>
              {duration && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {duration} min</span>}
            </div>
          </div>
          <Badge variant="outline" className="text-xs">{assessment.title} • {assessment.role}</Badge>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Aptitude", score: scores.aptitude_score, icon: Brain, color: "from-blue-500/10 to-blue-500/5" },
            { label: "Coding", score: scores.coding_score, icon: Code, color: "from-purple-500/10 to-purple-500/5" },
            { label: "Total", score: scores.total_score, icon: Trophy, color: "from-amber-500/10 to-amber-500/5" },
          ].map((item) => (
            <Card key={item.label} className="bg-gradient-to-br border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <item.icon className="h-4 w-4" /> {item.label}
                  </div>
                  <span className={`text-2xl font-bold ${scoreColor(item.score)}`}>{item.score}</span>
                </div>
                <Progress value={item.score} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Summary */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> AI Evaluation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{scores.ai_summary || "No AI summary available."}</p>
          </CardContent>
        </Card>

        {/* Aptitude Breakdown */}
        {aptitudeResponses.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4" /> Aptitude Questions ({aptitudeResponses.filter((r) => r.is_correct).length}/{aptitudeResponses.length} correct)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aptitudeResponses.map((r, i) => (
                <div key={i} className={`p-4 rounded-lg border ${r.is_correct ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium">Q{i + 1}: {r.question_text}</p>
                    <Badge variant={r.is_correct ? "default" : "destructive"} className="text-xs shrink-0 ml-2">
                      {r.is_correct ? "Correct" : "Wrong"}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs">
                    {r.options.map((opt, j) => (
                      <div key={j} className={`px-2 py-1 rounded ${j === r.correct_answer ? "text-green-600 font-medium" : j === r.candidate_answer && !r.is_correct ? "text-destructive line-through" : "text-muted-foreground"}`}>
                        {j === r.correct_answer ? "✓ " : j === r.candidate_answer && !r.is_correct ? "✗ " : "  "}{opt}
                      </div>
                    ))}
                    {r.candidate_answer === null && <p className="text-muted-foreground italic">Not answered</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Coding Breakdown */}
        {codingResponses.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Code className="h-4 w-4" /> Coding Submissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {codingResponses.map((r, i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <h4 className="text-sm font-medium mb-1">{r.title}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{r.description}</p>
                  {r.code ? (
                    <div className="bg-secondary rounded-lg p-3 overflow-x-auto">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">{r.language}</Badge>
                      </div>
                      <pre className="text-xs font-mono whitespace-pre-wrap">{r.code}</pre>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No code submitted</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default CandidateReport;
