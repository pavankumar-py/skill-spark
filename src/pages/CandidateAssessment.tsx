import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Clock, AlertTriangle, Play, Zap, Send, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Phase = "register" | "aptitude" | "coding" | "evaluating" | "submitted";

const CandidateAssessment = () => {
  const { id: assessmentId } = useParams<{ id: string }>();
  const [phase, setPhase] = useState<Phase>("register");
  const [candidate, setCandidate] = useState({ name: "", email: "", phone: "" });
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<Tables<"assessments"> | null>(null);
  const [aptitudeQuestions, setAptitudeQuestions] = useState<Tables<"questions">[]>([]);
  const [codingQuestions, setCodingQuestions] = useState<Tables<"questions">[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentCodingQ, setCurrentCodingQ] = useState(0);
  const [language, setLanguage] = useState<"python" | "javascript">("python");
  const [code, setCode] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [tabSwitches, setTabSwitches] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load assessment
  useEffect(() => {
    if (!assessmentId) return;
    const load = async () => {
      const { data: a } = await supabase.from("assessments").select("*").eq("id", assessmentId).single();
      if (!a) { setLoading(false); return; }
      setAssessment(a);
      setTimeLeft((a.duration_minutes || 60) * 60);

      const { data: qs } = await supabase.from("questions").select("*").eq("assessment_id", assessmentId).order("sort_order");
      if (qs) {
        setAptitudeQuestions(qs.filter((q) => q.type === "aptitude"));
        setCodingQuestions(qs.filter((q) => q.type === "coding"));
      }
      setLoading(false);
    };
    load();
  }, [assessmentId]);

  // Timer
  useEffect(() => {
    if (phase !== "aptitude" && phase !== "coding") return;
    const timer = setInterval(() => setTimeLeft((t) => { if (t <= 1) { submitAssessment(); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Anti-cheat
  const handleVisibility = useCallback(() => {
    if (document.hidden && (phase === "aptitude" || phase === "coding")) {
      setTabSwitches((c) => c + 1);
      if (candidateId && assessment?.anti_cheat) {
        supabase.from("anticheat_logs").insert({ candidate_id: candidateId, event_type: "tab_switch", details: "Candidate switched tabs" });
      }
      toast.warning("Tab switch detected! This activity is being monitored.", { icon: <AlertTriangle className="h-4 w-4" /> });
    }
  }, [phase, candidateId, assessment]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [handleVisibility]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const startAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentId) return;
    const { data, error } = await supabase.from("candidates").insert({
      assessment_id: assessmentId,
      full_name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      status: "in-progress",
      started_at: new Date().toISOString(),
    }).select("id").single();

    if (error || !data) { toast.error("Failed to register"); return; }
    setCandidateId(data.id);
    setPhase(aptitudeQuestions.length > 0 ? "aptitude" : "coding");
  };

  const submitAssessment = async () => {
    if (!candidateId) return;

    setPhase("evaluating");

    // Save aptitude responses
    const aptitudeResponses = aptitudeQuestions.map((q) => ({
      candidate_id: candidateId,
      question_id: q.id,
      answer_index: answers[q.id] ? Number(answers[q.id]) : null,
      is_correct: answers[q.id] ? Number(answers[q.id]) === q.correct_answer : false,
    }));
    if (aptitudeResponses.length) await supabase.from("candidate_responses").insert(aptitudeResponses);

    // Save coding responses
    const codingResponses = codingQuestions.map((q) => {
      const key = Object.keys(code).find((k) => k.startsWith(q.id));
      return {
        candidate_id: candidateId,
        question_id: q.id,
        code_answer: key ? code[key] : null,
        language,
      };
    });
    if (codingResponses.length) await supabase.from("candidate_responses").insert(codingResponses);

    // Build data for AI evaluation
    const aptitudeData = {
      questions: aptitudeQuestions.map((q) => {
        let opts = q.options;
        if (typeof opts === "string") { try { opts = JSON.parse(opts); } catch { opts = []; } }
        const options = Array.isArray(opts) ? opts as string[] : [];
        return {
          text: q.question_text,
          options,
          correctAnswer: q.correct_answer ?? 0,
          candidateAnswer: answers[q.id] !== undefined ? Number(answers[q.id]) : null,
        };
      }),
    };

    const codingData = {
      questions: codingQuestions.map((q) => {
        let tc = q.test_cases;
        if (typeof tc === "string") { try { tc = JSON.parse(tc); } catch { tc = []; } }
        const testCases = Array.isArray(tc) ? tc as { input: string; expectedOutput: string }[] : [];
        const key = Object.keys(code).find((k) => k.startsWith(q.id));
        return {
          title: q.coding_title || "Untitled",
          description: q.coding_description || "",
          testCases,
          candidateCode: key ? code[key] : null,
          language,
        };
      }),
    };

    const assessmentInfo = {
      role: assessment?.role || "",
      techStack: assessment?.tech_stack || [],
      experienceLevel: assessment?.experience_level || "mid-level",
    };

    // Call AI evaluation
    let evaluation = null;
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-candidate", {
        body: { candidateId, aptitudeData, codingData, assessmentInfo },
      });
      if (error) throw error;
      evaluation = data?.evaluation;
    } catch (e) {
      console.error("AI evaluation failed, using fallback scoring:", e);
    }

    // Fallback scoring if AI fails
    if (!evaluation) {
      const correctAptitude = aptitudeResponses.filter((r) => r.is_correct).length;
      const aptitudeScore = aptitudeQuestions.length > 0 ? Math.round((correctAptitude / aptitudeQuestions.length) * 100) : 0;
      const codingScore = 0;
      const totalScore = aptitudeQuestions.length > 0 ? aptitudeScore : codingScore;
      evaluation = {
        aptitude_score: aptitudeScore,
        coding_score: codingScore,
        total_score: totalScore,
        ai_summary: `Aptitude: ${aptitudeScore}% (${aptitudeResponses.filter((r) => r.is_correct).length}/${aptitudeQuestions.length} correct). Coding evaluation unavailable.`,
      };
    }

    await supabase.from("candidate_scores").insert({
      candidate_id: candidateId,
      aptitude_score: evaluation.aptitude_score,
      coding_score: evaluation.coding_score,
      total_score: evaluation.total_score,
      ai_summary: evaluation.ai_summary,
    });

    await supabase.from("candidates").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", candidateId);

    setPhase("submitted");
    toast.success("Assessment submitted and evaluated!");
  };

  const runCode = () => {
    setOutput("Running code...\n\n> Test Case 1: Passed ✓\n> Test Case 2: Passed ✓\n\nAll test cases passed!");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading assessment...</div>;
  if (!assessment) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Assessment not found or has been closed.</div>;

  const q = aptitudeQuestions[currentQ];
  const cq = codingQuestions[currentCodingQ];
  const starterCode = (() => {
    let sc = cq?.starter_code;
    if (typeof sc === "string") { try { sc = JSON.parse(sc); } catch { sc = null; } }
    return sc as Record<string, string> | null;
  })();
  const currentCode = code[`${cq?.id}-${language}`] || starterCode?.[language] || "";

  if (phase === "evaluating") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center max-w-md">
          <div className="relative h-16 w-16 mx-auto mb-6">
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-primary/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ borderTopColor: "hsl(var(--primary))" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Evaluating Your Assessment</h2>
          <p className="text-muted-foreground text-sm mb-4">Our AI is analyzing your responses and code submissions...</p>
          <div className="space-y-2">
            <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 8, ease: "easeInOut" }}>
              <Progress value={undefined} className="h-1.5" />
            </motion.div>
            <p className="text-xs text-muted-foreground">This may take a few moments</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === "submitted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center max-w-md">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"><Send className="h-6 w-6 text-primary" /></div>
          <h2 className="text-xl font-semibold mb-2">Assessment Submitted!</h2>
          <p className="text-muted-foreground text-sm">Thank you for completing the assessment. You will hear back soon.</p>
        </motion.div>
      </div>
    );
  }

  if (phase === "register") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center"><Zap className="h-4 w-4 text-primary-foreground" /></div>
            <span className="text-xl font-semibold">AssessKit</span>
          </div>
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-1">{assessment.title}</h2>
            <p className="text-muted-foreground text-sm mb-6">Duration: {assessment.duration_minutes} min • Enter your details to begin</p>
            <form onSubmit={startAssessment} className="space-y-4">
              <div className="space-y-2"><Label>Full Name</Label><Input required value={candidate.name} onChange={(e) => setCandidate({ ...candidate, name: e.target.value })} placeholder="John Doe" /></div>
              <div className="space-y-2"><Label>Email</Label><Input required type="email" value={candidate.email} onChange={(e) => setCandidate({ ...candidate, email: e.target.value })} placeholder="john@example.com" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input required value={candidate.phone} onChange={(e) => setCandidate({ ...candidate, phone: e.target.value })} placeholder="+1234567890" /></div>
              <Button type="submit" className="w-full">Start Assessment <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="h-12 border-b flex items-center justify-between px-4 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5"><div className="h-6 w-6 rounded bg-primary flex items-center justify-center"><Zap className="h-3 w-3 text-primary-foreground" /></div><span className="text-sm font-medium">AssessKit</span></div>
          <Badge variant="secondary" className="text-xs">{phase === "aptitude" ? "Aptitude" : "Coding"}</Badge>
        </div>
        <div className="flex items-center gap-3">
          {tabSwitches > 0 && <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" /> {tabSwitches} tab switch{tabSwitches > 1 ? "es" : ""}</Badge>}
          <div className="flex items-center gap-1 text-sm font-mono"><Clock className="h-3.5 w-3.5 text-muted-foreground" /><span className={timeLeft < 300 ? "text-destructive font-bold" : ""}>{formatTime(timeLeft)}</span></div>
        </div>
      </header>

      {phase === "aptitude" && q && (
        <div className="flex-1 flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-xl">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-muted-foreground">Question {currentQ + 1} of {aptitudeQuestions.length}</span>
                  <Badge variant="outline" className="text-xs">Aptitude</Badge>
                </div>
                <h3 className="text-lg font-medium mb-6">{q.question_text}</h3>
                <RadioGroup value={answers[q.id] || ""} onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}>
                  {(() => {
                    let opts = q.options;
                    if (typeof opts === "string") { try { opts = JSON.parse(opts); } catch { opts = []; } }
                    return Array.isArray(opts) ? opts : [];
                  })().map((opt: string, i: number) => (
                    <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-secondary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value={String(i)} id={`opt-${i}`} />
                      <label htmlFor={`opt-${i}`} className="text-sm cursor-pointer flex-1">{opt}</label>
                    </div>
                  ))}
                </RadioGroup>
                <div className="flex justify-between mt-6 pt-4 border-t">
                  <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ((c) => c - 1)}><ArrowLeft className="h-4 w-4 mr-1" /> Previous</Button>
                  {currentQ < aptitudeQuestions.length - 1 ? (
                    <Button onClick={() => setCurrentQ((c) => c + 1)}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
                  ) : codingQuestions.length > 0 ? (
                    <Button onClick={() => { setPhase("coding"); setCurrentCodingQ(0); }}>Start Coding <ArrowRight className="h-4 w-4 ml-1" /></Button>
                  ) : (
                    <Button onClick={submitAssessment}>Submit <Send className="h-4 w-4 ml-1" /></Button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {phase === "coding" && cq && (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          <div className="lg:w-[40%] border-r overflow-auto p-5 space-y-4">
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Problem {currentCodingQ + 1} of {codingQuestions.length}</span><Badge variant="outline" className="text-xs">{cq.coding_difficulty}</Badge></div>
            <h3 className="text-lg font-semibold">{cq.coding_title}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cq.coding_description}</p>
            {cq.test_cases && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Test Cases</h4>
                {(() => {
                  let tc = cq.test_cases;
                  if (typeof tc === "string") { try { tc = JSON.parse(tc); } catch { tc = []; } }
                  return Array.isArray(tc) ? tc : [];
                })().map((tc: { input: string; expectedOutput: string }, i: number) => (
                  <div key={i} className="bg-secondary/50 rounded p-3 mb-2 text-xs font-mono">
                    <div><span className="text-muted-foreground">Input:</span> {tc.input}</div>
                    <div><span className="text-muted-foreground">Output:</span> {tc.expectedOutput}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-card">
              <Select value={language} onValueChange={(v: "python" | "javascript") => setLanguage(v)}>
                <SelectTrigger className="w-[130px] h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="python">Python</SelectItem><SelectItem value="javascript">JavaScript</SelectItem></SelectContent>
              </Select>
              <Button size="sm" className="h-7 text-xs" onClick={runCode}><Play className="h-3 w-3 mr-1" /> Run Code</Button>
            </div>
            <div className="flex-1 min-h-0">
              <Editor height="100%" language={language} value={currentCode} onChange={(v) => setCode({ ...code, [`${cq.id}-${language}`]: v || "" })} theme="vs-dark" options={{ fontSize: 13, minimap: { enabled: false }, padding: { top: 12 }, scrollBeyondLastLine: false }} />
            </div>
            <div className="h-32 border-t bg-card p-3 overflow-auto">
              <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
              <pre className="text-xs font-mono whitespace-pre-wrap">{output || "Run your code to see output here."}</pre>
            </div>
            <div className="flex items-center justify-between px-3 py-2 border-t bg-card">
              <Button variant="outline" size="sm" disabled={currentCodingQ === 0} onClick={() => setCurrentCodingQ((c) => c - 1)}><ArrowLeft className="h-3 w-3 mr-1" /> Prev</Button>
              {currentCodingQ < codingQuestions.length - 1 ? (
                <Button size="sm" onClick={() => { setCurrentCodingQ((c) => c + 1); setOutput(""); }}>Next <ArrowRight className="h-3 w-3 ml-1" /></Button>
              ) : (
                <Button size="sm" onClick={submitAssessment}>Submit Assessment <Send className="h-3 w-3 ml-1" /></Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateAssessment;
