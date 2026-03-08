import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Send, Filter, ArrowUpDown, Search } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CandidateRow {
  id: string;
  name: string;
  email: string;
  assessmentName: string;
  aptitudeScore: number;
  codingScore: number;
  totalScore: number;
  aiSummary: string;
}

const EvaluateCandidates = () => {
  const { companyId } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"score" | "name">("score");
  const [filterPercent, setFilterPercent] = useState<string>("all");
  const [minScore, setMinScore] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    const fetchCandidates = async () => {
      const { data: assessments } = await supabase.from("assessments").select("id, title").eq("company_id", companyId);
      if (!assessments?.length) { setLoading(false); return; }

      const ids = assessments.map((a) => a.id);
      const { data: cands } = await supabase.from("candidates").select("id, full_name, email, assessment_id").in("assessment_id", ids).eq("status", "completed");
      if (!cands?.length) { setLoading(false); return; }

      const candIds = cands.map((c) => c.id);
      const { data: scores } = await supabase.from("candidate_scores").select("*").in("candidate_id", candIds);

      const rows: CandidateRow[] = cands.map((c) => {
        const s = scores?.find((sc) => sc.candidate_id === c.id);
        const a = assessments.find((a) => a.id === c.assessment_id);
        return {
          id: c.id,
          name: c.full_name,
          email: c.email,
          assessmentName: a?.title || "",
          aptitudeScore: Number(s?.aptitude_score || 0),
          codingScore: Number(s?.coding_score || 0),
          totalScore: Number(s?.total_score || 0),
          aiSummary: s?.ai_summary || "",
        };
      });
      setCandidates(rows);
      setLoading(false);
    };
    fetchCandidates();
  }, [companyId]);

  const searched = candidates.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase()) || c.assessmentName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sorted = [...searched].sort((a, b) => sortBy === "score" ? b.totalScore - a.totalScore : a.name.localeCompare(b.name));
  const filtered = sorted.filter((c) => {
    if (minScore && c.totalScore < Number(minScore)) return false;
    if (filterPercent === "all") return true;
    const cutoff = Math.ceil(sorted.length * (Number(filterPercent) / 100));
    return sorted.indexOf(c) < cutoff;
  });

  const toggleSelect = (id: string) => setSelected((s) => s.includes(id) ? s.filter((i) => i !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map((c) => c.id));
  const openSmartSend = () => setShowComingSoon(true);

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold mb-1">Evaluate Candidates</h1>
        <p className="text-muted-foreground text-sm mb-6">Review scores and communicate with candidates</p>
      </motion.div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search candidates..." className="pl-9 h-8 text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterPercent} onValueChange={setFilterPercent}><SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Candidates</SelectItem><SelectItem value="10">Top 10%</SelectItem><SelectItem value="20">Top 20%</SelectItem></SelectContent></Select>
        </div>
        <Input placeholder="Min score..." className="w-24 h-8 text-xs" value={minScore} onChange={(e) => setMinScore(e.target.value)} />
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSortBy(sortBy === "score" ? "name" : "score")}>
          <ArrowUpDown className="h-3 w-3 mr-1" /> {sortBy === "score" ? "By Score" : "By Name"}
        </Button>
        <div className="flex-1" />
        {selected.length > 0 && <Button size="sm" className="h-8" onClick={openSmartSend}><Send className="h-3 w-3 mr-1" /> Smart Send ({selected.length})</Button>}
      </div>

      {candidates.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">No completed candidates yet.</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="p-3 w-10"><Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Assessment</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Aptitude</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Coding</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Total %</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">AI Summary</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="p-3"><Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggleSelect(c.id)} /></td>
                    <td className="p-3">
                      <span className="font-medium cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/app/evaluate/${c.id}`)}>{c.name}</span>
                      <span className="block text-xs text-muted-foreground">{c.email}</span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{c.assessmentName}</td>
                    <td className="p-3 text-center font-medium">{c.aptitudeScore}</td>
                    <td className="p-3 text-center font-medium">{c.codingScore}</td>
                    <td className="p-3 text-center"><Badge variant={c.totalScore >= 80 ? "default" : c.totalScore >= 50 ? "secondary" : "destructive"}>{c.totalScore}%</Badge></td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">{c.aiSummary || "—"}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader><DialogTitle>Coming Soon</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">This feature will be available in the future. You'll be notified when it releases.</p>
          <DialogFooter className="justify-center"><Button onClick={() => setShowComingSoon(false)}>Got it</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EvaluateCandidates;
