import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Brain, Code, Trophy, FileText, Mail, Clock, Calculator, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const NUMERICAL_KEYWORDS = [
  "percentage", "percent", "ratio", "proportion", "profit", "loss", "interest",
  "time and work", "speed", "distance", "average", "probability", "permutation",
  "combination", "series", "sequence", "number series", "arithmetic", "geometric",
  "factorial", "lcm", "hcf", "gcd", "divisible", "remainder", "modulo",
  "train", "pipe", "cistern", "age", "mixture", "alligation", "boat", "stream",
  "compound interest", "simple interest", "discount", "marked price",
  "how many", "find the value", "what is the sum", "calculate",
  "days", "salary", "wages", "cost", "price", "sold", "buys", "sells",
  "liters", "litres", "gallons", "meters", "kilometres", "km/h", "mph",
  "complete a task", "finish the work", "working together", "can do",
  "workers", "men and women", "efficiency",
];

function isNumericalQuestion(text: string): boolean {
  const lower = text.toLowerCase();
  if (/`[^`]+`/.test(text) || lower.includes("output of") || lower.includes("syntax") || (lower.includes("function") && lower.includes("return"))) {
    return false;
  }
  return NUMERICAL_KEYWORDS.some((kw) => lower.includes(kw));
}

interface ReportData {
  candidate: { full_name: string; email: string; phone: string | null; started_at: string | null; completed_at: string | null };
  assessment: { title: string; role: string; tech_stack: string[]; experience_level: string | null };
  scores: { aptitude_score: number; coding_score: number; total_score: number; ai_summary: string };
  aptitudeResponses: { question_text: string; options: string[]; correct_answer: number; candidate_answer: number | null; is_correct: boolean }[];
  codingResponses: { title: string; description: string; code: string | null; language: string | null; is_correct: boolean | null }[];
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
          is_correct: r?.is_correct ?? null,
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
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!report) return <div className="p-6 text-muted-foreground">Candidate not found.</div>;

  const { candidate, assessment, scores, aptitudeResponses, codingResponses } = report;

  // Compute marks breakdown
  const classifiedAptitude = aptitudeResponses.map((r, i) => ({ ...r, index: i, isNumerical: isNumericalQuestion(r.question_text) }));
  const technicalQs = classifiedAptitude.filter((r) => !r.isNumerical);
  const numericalQs = classifiedAptitude.filter((r) => r.isNumerical);
  const technicalCorrect = technicalQs.filter((r) => r.is_correct).length;
  const numericalCorrect = numericalQs.filter((r) => r.is_correct).length;
  const codingCorrect = codingResponses.filter((r) => r.is_correct === true).length;
  const totalMarks = technicalCorrect + numericalCorrect + codingCorrect;
  const totalPossible = technicalQs.length + numericalQs.length + codingResponses.length;

  const duration = candidate.started_at && candidate.completed_at
    ? Math.round((new Date(candidate.completed_at).getTime() - new Date(candidate.started_at).getTime()) / 60000)
    : null;

  const marksBadge = (correct: number, total: number) => {
    if (total === 0) return "text-muted-foreground";
    const pct = (correct / total) * 100;
    return pct >= 80 ? "text-green-500" : pct >= 50 ? "text-yellow-500" : "text-destructive";
  };

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

        {/* Score Cards - 4 categories with marks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                <Code className="h-4 w-4" /> Technical MCQs
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-3xl font-bold ${marksBadge(technicalCorrect, technicalQs.length)}`}>{technicalCorrect}</span>
                <span className="text-lg text-muted-foreground">/ {technicalQs.length}</span>
              </div>
              <Progress value={technicalQs.length > 0 ? (technicalCorrect / technicalQs.length) * 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">1 mark per correct answer</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                <Calculator className="h-4 w-4" /> Numerical Ability
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-3xl font-bold ${marksBadge(numericalCorrect, numericalQs.length)}`}>{numericalCorrect}</span>
                <span className="text-lg text-muted-foreground">/ {numericalQs.length}</span>
              </div>
              <Progress value={numericalQs.length > 0 ? (numericalCorrect / numericalQs.length) * 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">1 mark per correct answer</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                <Code className="h-4 w-4" /> Coding
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-3xl font-bold ${marksBadge(codingCorrect, codingResponses.length)}`}>{codingCorrect}</span>
                <span className="text-lg text-muted-foreground">/ {codingResponses.length}</span>
              </div>
              <Progress value={codingResponses.length > 0 ? (codingCorrect / codingResponses.length) * 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">1 mark if ≥50% correct code</p>
            </CardContent>
          </Card>

          <Card className="border bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                <Trophy className="h-4 w-4" /> Total Score
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-3xl font-bold ${marksBadge(totalMarks, totalPossible)}`}>{totalMarks}</span>
                <span className="text-lg text-muted-foreground">/ {totalPossible}</span>
              </div>
              <Progress value={totalPossible > 0 ? (totalMarks / totalPossible) * 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{totalPossible > 0 ? Math.round((totalMarks / totalPossible) * 100) : 0}% overall</p>
            </CardContent>
          </Card>
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
        {aptitudeResponses.length > 0 && (() => {
          const renderQuestion = (r: typeof classifiedAptitude[0]) => (
            <div key={r.index} className={`p-4 rounded-lg border ${r.is_correct ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium">Q{r.index + 1}: {r.question_text}</p>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <Badge variant="outline" className="text-xs gap-1">
                    {r.isNumerical ? <><Calculator className="h-3 w-3" /> Numerical</> : <><Code className="h-3 w-3" /> Technical</>}
                  </Badge>
                  <Badge variant={r.is_correct ? "default" : "destructive"} className="text-xs gap-1">
                    {r.is_correct ? <><CheckCircle2 className="h-3 w-3" /> 1 mark</> : <><XCircle className="h-3 w-3" /> 0 marks</>}
                  </Badge>
                </div>
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
          );

          return (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4" /> Aptitude Questions
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {technicalCorrect + numericalCorrect}/{aptitudeResponses.length} correct
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All ({classifiedAptitude.length})</TabsTrigger>
                    <TabsTrigger value="technical">
                      <Code className="h-3.5 w-3.5 mr-1" /> Technical ({technicalQs.length}) — {technicalCorrect} ✓
                    </TabsTrigger>
                    <TabsTrigger value="numerical">
                      <Calculator className="h-3.5 w-3.5 mr-1" /> Numerical ({numericalQs.length}) — {numericalCorrect} ✓
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="space-y-4">{classifiedAptitude.map(renderQuestion)}</TabsContent>
                  <TabsContent value="technical" className="space-y-4">
                    {technicalQs.length ? technicalQs.map(renderQuestion) : <p className="text-sm text-muted-foreground">No technical questions.</p>}
                  </TabsContent>
                  <TabsContent value="numerical" className="space-y-4">
                    {numericalQs.length ? numericalQs.map(renderQuestion) : <p className="text-sm text-muted-foreground">No numerical questions.</p>}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          );
        })()}

        {/* Coding Breakdown */}
        {codingResponses.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4" /> Coding Submissions
                <Badge variant="secondary" className="ml-auto text-xs">
                  {codingCorrect}/{codingResponses.length} passed (≥50% threshold)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {codingResponses.map((r, i) => (
                <div key={i} className={`p-4 rounded-lg border ${r.is_correct === true ? "border-green-500/30 bg-green-500/5" : r.is_correct === false ? "border-destructive/30 bg-destructive/5" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium">{r.title}</h4>
                    <Badge variant={r.is_correct === true ? "default" : r.is_correct === false ? "destructive" : "secondary"} className="text-xs gap-1">
                      {r.is_correct === true ? <><CheckCircle2 className="h-3 w-3" /> 1 mark</> : r.is_correct === false ? <><XCircle className="h-3 w-3" /> 0 marks</> : "Not evaluated"}
                    </Badge>
                  </div>
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
