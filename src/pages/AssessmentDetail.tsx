import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Clock, Copy, FileText, Code, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const AssessmentDetail = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Tables<"assessments"> | null>(null);
  const [questions, setQuestions] = useState<Tables<"questions">[]>([]);
  const [candidates, setCandidates] = useState<Tables<"candidates">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assessmentId) return;
    const load = async () => {
      const [{ data: a }, { data: qs }, { data: cs }] = await Promise.all([
        supabase.from("assessments").select("*").eq("id", assessmentId).single(),
        supabase.from("questions").select("*").eq("assessment_id", assessmentId).order("sort_order"),
        supabase.from("candidates").select("*").eq("assessment_id", assessmentId).order("created_at", { ascending: false }),
      ]);
      setAssessment(a);
      setQuestions(qs || []);
      setCandidates(cs || []);
      setLoading(false);
    };
    load();
  }, [assessmentId]);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/take/${assessmentId}`);
    toast.success("Link copied!");
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!assessment) return <div className="p-6 text-muted-foreground">Assessment not found.</div>;

  const aptitudeQs = questions.filter((q) => q.type === "aptitude");
  const codingQs = questions.filter((q) => q.type === "coding");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/app/assessments")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{assessment.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{assessment.role} • {assessment.experience_level || "Any level"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={assessment.status === "active" ? "default" : "secondary"}>{assessment.status}</Badge>
            <Button size="sm" variant="outline" onClick={copyLink}><Copy className="h-3 w-3 mr-1" /> Copy Link</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Duration</p><p className="font-semibold">{assessment.duration_minutes} min</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Brain className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Aptitude</p><p className="font-semibold">{aptitudeQs.length} Qs</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Code className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Coding</p><p className="font-semibold">{codingQs.length} Qs</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Users className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Candidates</p><p className="font-semibold">{candidates.length}</p></div></CardContent></Card>
        </div>

        {/* Tech Stack */}
        {assessment.tech_stack && assessment.tech_stack.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">{assessment.tech_stack.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</div>
          </div>
        )}

        {/* Questions */}
        {aptitudeQs.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Brain className="h-4 w-4" /> Aptitude Questions ({aptitudeQs.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {aptitudeQs.map((q, i) => (
                <div key={q.id} className="p-3 rounded-lg border text-sm">
                  <p className="font-medium">Q{i + 1}: {q.question_text}</p>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {(() => { let opts = q.options; if (typeof opts === "string") { try { opts = JSON.parse(opts); } catch { opts = []; } } return Array.isArray(opts) ? opts : []; })().map((opt: string, j: number) => (
                      <div key={j} className={j === q.correct_answer ? "text-primary font-medium" : ""}>{j === q.correct_answer ? "✓ " : "  "}{opt}</div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {codingQs.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Code className="h-4 w-4" /> Coding Questions ({codingQs.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {codingQs.map((q, i) => (
                <div key={q.id} className="p-3 rounded-lg border text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">{q.coding_title}</p>
                    <Badge variant="outline" className="text-xs">{q.coding_difficulty}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{q.coding_description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Candidates */}
        {candidates.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Candidates ({candidates.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left p-2 text-muted-foreground font-medium">Name</th><th className="text-left p-2 text-muted-foreground font-medium">Email</th><th className="text-left p-2 text-muted-foreground font-medium">Status</th><th className="text-left p-2 text-muted-foreground font-medium">Date</th></tr></thead>
                  <tbody>
                    {candidates.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-secondary/30 cursor-pointer" onClick={() => c.status === "completed" && navigate(`/app/evaluate/${c.id}`)}>
                        <td className="p-2 font-medium">{c.full_name}</td>
                        <td className="p-2 text-muted-foreground">{c.email}</td>
                        <td className="p-2"><Badge variant={c.status === "completed" ? "default" : "secondary"} className="text-xs">{c.status}</Badge></td>
                        <td className="p-2 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default AssessmentDetail;
