import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockAptitudeQuestions, mockCodingQuestions } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Clock, AlertTriangle, Play, Zap, Send } from "lucide-react";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";

type Phase = "register" | "aptitude" | "coding" | "submitted";

const CandidateAssessment = () => {
  const [phase, setPhase] = useState<Phase>("register");
  const [candidate, setCandidate] = useState({ name: "", email: "", phone: "" });
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 min
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentCodingQ, setCurrentCodingQ] = useState(0);
  const [language, setLanguage] = useState<"python" | "javascript">("python");
  const [code, setCode] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [tabSwitches, setTabSwitches] = useState(0);

  // Timer
  useEffect(() => {
    if (phase !== "aptitude" && phase !== "coding") return;
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Anti-cheat: tab switching
  const handleVisibility = useCallback(() => {
    if (document.hidden && (phase === "aptitude" || phase === "coding")) {
      setTabSwitches((c) => c + 1);
      toast.warning("Tab switch detected! This activity is being monitored.", { icon: <AlertTriangle className="h-4 w-4" /> });
    }
  }, [phase]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [handleVisibility]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const startAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    setPhase("aptitude");
  };

  const runCode = () => {
    setOutput("Running code...\n\n> Test Case 1: Passed ✓\n> Test Case 2: Passed ✓\n\nAll test cases passed!");
  };

  const submitAssessment = () => {
    setPhase("submitted");
    toast.success("Assessment submitted successfully!");
  };

  const q = mockAptitudeQuestions[currentQ];
  const cq = mockCodingQuestions[currentCodingQ];
  const currentCode = code[`${cq?.id}-${language}`] || cq?.starterCode[language] || "";

  if (phase === "submitted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center max-w-md">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Send className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Assessment Submitted!</h2>
          <p className="text-muted-foreground text-sm">Thank you for completing the assessment. You will hear back from the hiring team soon.</p>
        </motion.div>
      </div>
    );
  }

  if (phase === "register") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">AssessKit</span>
          </div>
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-1">Technical Assessment</h2>
            <p className="text-muted-foreground text-sm mb-6">Enter your details to begin</p>
            <form onSubmit={startAssessment} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input required value={candidate.name} onChange={(e) => setCandidate({ ...candidate, name: e.target.value })} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input required type="email" value={candidate.email} onChange={(e) => setCandidate({ ...candidate, email: e.target.value })} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input required value={candidate.phone} onChange={(e) => setCandidate({ ...candidate, phone: e.target.value })} placeholder="+1234567890" />
              </div>
              <Button type="submit" className="w-full">Start Assessment <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="h-12 border-b flex items-center justify-between px-4 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <Zap className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">AssessKit</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {phase === "aptitude" ? "Aptitude" : "Coding"}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {tabSwitches > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" /> {tabSwitches} tab switch{tabSwitches > 1 ? "es" : ""}
            </Badge>
          )}
          <div className="flex items-center gap-1 text-sm font-mono">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={timeLeft < 300 ? "text-destructive font-bold" : ""}>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {phase === "aptitude" && (
        <div className="flex-1 flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-xl">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-muted-foreground">Question {currentQ + 1} of {mockAptitudeQuestions.length}</span>
                  <Badge variant="outline" className="text-xs">Aptitude</Badge>
                </div>
                <h3 className="text-lg font-medium mb-6">{q.question}</h3>
                <RadioGroup value={answers[q.id] || ""} onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}>
                  {q.options.map((opt, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-secondary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value={String(i)} id={`opt-${i}`} />
                      <label htmlFor={`opt-${i}`} className="text-sm cursor-pointer flex-1">{opt}</label>
                    </div>
                  ))}
                </RadioGroup>
                <div className="flex justify-between mt-6 pt-4 border-t">
                  <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ((c) => c - 1)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  {currentQ < mockAptitudeQuestions.length - 1 ? (
                    <Button onClick={() => setCurrentQ((c) => c + 1)}>
                      Next <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={() => { setPhase("coding"); setCurrentCodingQ(0); }}>
                      Start Coding Section <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {phase === "coding" && cq && (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Problem */}
          <div className="lg:w-[40%] border-r overflow-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Problem {currentCodingQ + 1} of {mockCodingQuestions.length}</span>
              <Badge variant="outline" className="text-xs">{cq.difficulty}</Badge>
            </div>
            <h3 className="text-lg font-semibold">{cq.title}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cq.description}</p>
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Test Cases</h4>
              {cq.testCases.map((tc, i) => (
                <div key={i} className="bg-secondary/50 rounded p-3 mb-2 text-xs font-mono">
                  <div><span className="text-muted-foreground">Input:</span> {tc.input}</div>
                  <div><span className="text-muted-foreground">Output:</span> {tc.expectedOutput}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-card">
              <Select value={language} onValueChange={(v: "python" | "javascript") => setLanguage(v)}>
                <SelectTrigger className="w-[130px] h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="h-7 text-xs" onClick={runCode}>
                <Play className="h-3 w-3 mr-1" /> Run Code
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={language}
                value={currentCode}
                onChange={(v) => setCode({ ...code, [`${cq.id}-${language}`]: v || "" })}
                theme="vs-dark"
                options={{ fontSize: 13, minimap: { enabled: false }, padding: { top: 12 }, scrollBeyondLastLine: false }}
              />
            </div>
            <div className="h-32 border-t bg-card p-3 overflow-auto">
              <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
              <pre className="text-xs font-mono whitespace-pre-wrap">{output || "Run your code to see output here."}</pre>
            </div>
            <div className="flex items-center justify-between px-3 py-2 border-t bg-card">
              <Button variant="outline" size="sm" disabled={currentCodingQ === 0} onClick={() => setCurrentCodingQ((c) => c - 1)}>
                <ArrowLeft className="h-3 w-3 mr-1" /> Prev
              </Button>
              {currentCodingQ < mockCodingQuestions.length - 1 ? (
                <Button size="sm" onClick={() => { setCurrentCodingQ((c) => c + 1); setOutput(""); }}>
                  Next <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={submitAssessment}>
                  Submit Assessment <Send className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateAssessment;
