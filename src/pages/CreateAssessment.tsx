import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, ArrowLeft, Copy, Link } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const steps = ["Details", "Aptitude", "Coding", "Configuration", "Review"];
const techOptions = ["Python", "JavaScript", "React", "Node.js", "TypeScript", "SQL", "Java", "Go", "Rust", "C++"];
const codingTopicOptions = ["DSA", "Arrays", "Strings", "OOPs", "Recursion", "Algorithms"];
const numericalTopicOptions = ["Percentages", "Ratios", "Number Series", "Profit & Loss", "Time & Work", "Probability", "Averages", "Simple Interest", "Compound Interest", "Speed & Distance"];
const technicalMcqTopicOptions = ["Networking", "Cloud Computing", "Databases", "Operating Systems", "Data Structures", "Algorithms", "System Design", "Security", "APIs", "DevOps"];

const CreateAssessment = () => {
  const { companyId } = useAuth();
  const [step, setStep] = useState(0);
  const [created, setCreated] = useState(false);
  const [createdId, setCreatedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    role: "",
    techStack: [] as string[],
    experience: "",
    technicalCount: "5",
    numericalCount: "5",
    aptitudeDifficulty: "",
    numericalTopics: [] as string[],
    technicalMcqTopics: [] as string[],
    codingCount: "2",
    codingDifficulty: "",
    codingTopics: [] as string[],
    duration: "60",
    antiCheat: true,
    allowExecution: true,
  });

  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  const next = () => setStep((s) => Math.min(s + 1, 4));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleCreate = async () => {
    if (!companyId) { toast.error("Company not found"); return; }
    setSaving(true);
    toast.info("Generating AI-powered questions... This may take a moment.");

    try {
      // Step 1: Generate questions via AI
      const { data: aiData, error: aiError } = await supabase.functions.invoke("generate-questions", {
        body: {
          role: form.role,
          techStack: form.techStack,
          experience: form.experience,
          aptitudeCount: Number(form.aptitudeCount),
          aptitudeDifficulty: form.aptitudeDifficulty,
          codingCount: Number(form.codingCount),
          codingDifficulty: form.codingDifficulty,
          codingTopics: form.codingTopics,
        },
      });

      if (aiError || aiData?.error) {
        toast.error(aiData?.error || aiError?.message || "Failed to generate questions");
        setSaving(false);
        return;
      }

      // Step 2: Create the assessment
      const { data, error } = await supabase.from("assessments").insert({
        company_id: companyId,
        title: form.title,
        role: form.role,
        tech_stack: form.techStack,
        experience_level: form.experience,
        aptitude_count: Number(form.aptitudeCount),
        coding_count: Number(form.codingCount),
        aptitude_difficulty: form.aptitudeDifficulty,
        coding_difficulty: form.codingDifficulty,
        coding_topics: form.codingTopics,
        duration_minutes: Number(form.duration),
        anti_cheat: form.antiCheat,
        allow_execution: form.allowExecution,
      }).select("id").single();

      if (error) { toast.error(error.message); setSaving(false); return; }

      // Step 3: Insert AI-generated questions
      const aptitudeQs = (aiData.aptitude || []).map((q: any, i: number) => ({
        assessment_id: data.id,
        type: "aptitude" as const,
        question_text: q.question_text,
        options: JSON.stringify(q.options),
        correct_answer: q.correct_answer,
        sort_order: i,
      }));

      const codingQs = (aiData.coding || []).map((q: any, i: number) => ({
        assessment_id: data.id,
        type: "coding" as const,
        question_text: q.coding_title,
        coding_title: q.coding_title,
        coding_description: q.coding_description,
        coding_difficulty: q.coding_difficulty,
        coding_topic: q.coding_topic,
        test_cases: JSON.stringify(q.test_cases),
        starter_code: JSON.stringify({ python: q.starter_code_python, javascript: q.starter_code_javascript }),
        sort_order: i,
      }));

      await supabase.from("questions").insert([...aptitudeQs, ...codingQs]);

      setCreatedId(data.id);
      setCreated(true);
      toast.success("Assessment created with AI-generated questions!");
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const assessmentLink = `${window.location.origin}/take/${createdId}`;
  const copyLink = () => { navigator.clipboard.writeText(assessmentLink); toast.success("Link copied!"); };

  if (created) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Assessment Created!</h2>
          <p className="text-muted-foreground text-sm mb-6">Share this link with candidates to start the assessment.</p>
          <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg mb-4">
            <Link className="h-4 w-4 text-muted-foreground shrink-0" />
            <code className="text-sm flex-1 text-left truncate">{assessmentLink}</code>
            <Button size="sm" variant="outline" onClick={copyLink}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
          </div>
          <Button onClick={() => { setCreated(false); setStep(0); setForm({ ...form, title: "" }); }}>Create Another</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Create Assessment</h1>
      <p className="text-muted-foreground text-sm mb-8">Set up a new technical assessment for candidates</p>

      <div className="flex items-center mb-8 gap-1">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <button onClick={() => i < step && setStep(i)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/10 text-primary cursor-pointer" : "bg-secondary text-muted-foreground"}`}>
              {i < step ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < steps.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="glass-card p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Assessment Details</h3>
              <div className="space-y-2"><Label>Assessment Title</Label><Input placeholder="e.g. Senior Frontend Engineer Test" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent>{["Frontend", "Backend", "Data", "Fullstack"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>Tech Stack</Label><div className="flex flex-wrap gap-2">{techOptions.map((t) => <Badge key={t} variant={form.techStack.includes(t) ? "default" : "outline"} className="cursor-pointer" onClick={() => setForm({ ...form, techStack: toggleArrayItem(form.techStack, t) })}>{t}</Badge>)}</div></div>
              <div className="space-y-2"><Label>Experience Level</Label>
                <Select value={form.experience} onValueChange={(v) => setForm({ ...form, experience: v })}><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger><SelectContent>{["Fresher", "1-3 years", "3-5 years", "5+ years"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium">Aptitude Questions</h3>
              <div className="space-y-2"><Label>Number of Questions</Label><Select value={form.aptitudeCount} onValueChange={(v) => setForm({ ...form, aptitudeCount: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["5", "10", "15", "20"].map((n) => <SelectItem key={n} value={n}>{n} questions</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Difficulty Level</Label><Select value={form.aptitudeDifficulty} onValueChange={(v) => setForm({ ...form, aptitudeDifficulty: v })}><SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger><SelectContent>{["Easy", "Medium", "Hard"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
              <p className="text-xs text-muted-foreground">Questions will be AI-generated based on the selected role and tech stack.</p>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium">Coding Questions</h3>
              <div className="space-y-2"><Label>Number of Questions</Label><Select value={form.codingCount} onValueChange={(v) => setForm({ ...form, codingCount: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["1", "2", "3", "4", "5"].map((n) => <SelectItem key={n} value={n}>{n} questions</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Difficulty Level</Label><Select value={form.codingDifficulty} onValueChange={(v) => setForm({ ...form, codingDifficulty: v })}><SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger><SelectContent>{["Easy", "Medium", "Hard"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Topics</Label><div className="flex flex-wrap gap-2">{topicOptions.map((t) => <Badge key={t} variant={form.codingTopics.includes(t) ? "default" : "outline"} className="cursor-pointer" onClick={() => setForm({ ...form, codingTopics: toggleArrayItem(form.codingTopics, t) })}>{t}</Badge>)}</div></div>
              <p className="text-xs text-muted-foreground">Supported languages: Python, JavaScript</p>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium">Assessment Configuration</h3>
              <div className="space-y-2"><Label>Duration (minutes)</Label><Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["30", "45", "60", "90", "120", "150", "180"].map((d) => <SelectItem key={d} value={d}>{d} minutes</SelectItem>)}</SelectContent></Select></div>
              <div className="flex items-center justify-between py-2"><div><p className="text-sm font-medium">Anti-Cheat Monitoring</p><p className="text-xs text-muted-foreground">Tab switching, fullscreen, activity monitoring</p></div><Switch checked={form.antiCheat} onCheckedChange={(v) => setForm({ ...form, antiCheat: v })} /></div>
              <div className="flex items-center justify-between py-2"><div><p className="text-sm font-medium">Allow Code Execution</p><p className="text-xs text-muted-foreground">Candidates can run and test their code</p></div><Switch checked={form.allowExecution} onCheckedChange={(v) => setForm({ ...form, allowExecution: v })} /></div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-medium">Review Assessment</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1"><p className="text-muted-foreground text-xs">Title</p><p className="font-medium">{form.title || "—"}</p></div>
                <div className="space-y-1"><p className="text-muted-foreground text-xs">Role</p><p className="font-medium">{form.role || "—"}</p></div>
                <div className="space-y-1"><p className="text-muted-foreground text-xs">Experience</p><p className="font-medium">{form.experience || "—"}</p></div>
                <div className="space-y-1"><p className="text-muted-foreground text-xs">Duration</p><p className="font-medium">{form.duration} min</p></div>
                <div className="space-y-1"><p className="text-muted-foreground text-xs">Aptitude Questions</p><p className="font-medium">{form.aptitudeCount} ({form.aptitudeDifficulty || "—"})</p></div>
                <div className="space-y-1"><p className="text-muted-foreground text-xs">Coding Questions</p><p className="font-medium">{form.codingCount} ({form.codingDifficulty || "—"})</p></div>
                <div className="space-y-1 col-span-2"><p className="text-muted-foreground text-xs">Tech Stack</p><div className="flex flex-wrap gap-1">{form.techStack.length ? form.techStack.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>) : <span className="text-muted-foreground">—</span>}</div></div>
                <div className="space-y-1"><p className="text-muted-foreground text-xs">Anti-Cheat</p><p className="font-medium">{form.antiCheat ? "Enabled" : "Disabled"}</p></div>
                <div className="space-y-1"><p className="text-muted-foreground text-xs">Code Execution</p><p className="font-medium">{form.allowExecution ? "Allowed" : "Disabled"}</p></div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button variant="outline" onClick={prev} disabled={step === 0}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            {step < 4 ? (
              <Button onClick={next}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
            ) : (
              <Button onClick={handleCreate} disabled={saving}>{saving ? "Creating..." : "Create Assessment"} {!saving && <Check className="h-4 w-4 ml-1" />}</Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CreateAssessment;
