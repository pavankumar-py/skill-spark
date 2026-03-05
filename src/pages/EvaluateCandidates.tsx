import { useState } from "react";
import { mockCandidates } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Filter, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

type MessageType = "qualified" | "interview" | "rejection";
const messageTemplates: Record<MessageType, string> = {
  qualified: "Dear {name},\n\nCongratulations! You have been qualified for the next round of our hiring process.\n\nBest regards,\nThe Hiring Team",
  interview: "Dear {name},\n\nWe are pleased to invite you for an interview. Please respond with your availability.\n\nBest regards,\nThe Hiring Team",
  rejection: "Dear {name},\n\nThank you for participating in our assessment. Unfortunately, we will not be moving forward with your application at this time.\n\nBest regards,\nThe Hiring Team",
};

const EvaluateCandidates = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"score" | "name">("score");
  const [filterPercent, setFilterPercent] = useState<string>("all");
  const [minScore, setMinScore] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [messageType, setMessageType] = useState<MessageType>("qualified");
  const [customMessage, setCustomMessage] = useState("");

  const sorted = [...mockCandidates].sort((a, b) =>
    sortBy === "score" ? b.totalScore - a.totalScore : a.name.localeCompare(b.name)
  );

  const filtered = sorted.filter((c) => {
    if (minScore && c.totalScore < Number(minScore)) return false;
    if (filterPercent === "all") return true;
    const cutoffIndex = Math.ceil(sorted.length * (Number(filterPercent) / 100));
    const topScored = [...sorted].slice(0, cutoffIndex);
    return topScored.some((t) => t.id === c.id);
  });

  const toggleSelect = (id: string) => setSelected((s) => s.includes(id) ? s.filter((i) => i !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map((c) => c.id));

  const handleSend = () => {
    toast.success(`Messages sent to ${selected.length} candidate(s)!`);
    setShowModal(false);
    setSelected([]);
  };

  const openSmartSend = () => {
    setCustomMessage(messageTemplates[messageType]);
    setShowModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold mb-1">Evaluate Candidates</h1>
        <p className="text-muted-foreground text-sm mb-6">Review scores and communicate with candidates</p>
      </motion.div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterPercent} onValueChange={setFilterPercent}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Candidates</SelectItem>
              <SelectItem value="10">Top 10%</SelectItem>
              <SelectItem value="20">Top 20%</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input placeholder="Min score..." className="w-24 h-8 text-xs" value={minScore} onChange={(e) => setMinScore(e.target.value)} />
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSortBy(sortBy === "score" ? "name" : "score")}>
          <ArrowUpDown className="h-3 w-3 mr-1" /> {sortBy === "score" ? "By Score" : "By Name"}
        </Button>
        <div className="flex-1" />
        {selected.length > 0 && (
          <Button size="sm" className="h-8" onClick={openSmartSend}>
            <Send className="h-3 w-3 mr-1" /> Smart Send ({selected.length})
          </Button>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="p-3 w-10">
                  <Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                </th>
                <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Assessment</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Aptitude</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Coding</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left p-3 font-medium text-muted-foreground">AI Summary</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="p-3">
                    <Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                  </td>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-muted-foreground">{c.email}</td>
                  <td className="p-3 text-muted-foreground text-xs">{c.assessmentName}</td>
                  <td className="p-3 text-center">{c.aptitudeScore}</td>
                  <td className="p-3 text-center">{c.codingScore}</td>
                  <td className="p-3 text-center">
                    <Badge variant={c.totalScore >= 80 ? "default" : c.totalScore >= 60 ? "secondary" : "destructive"}>
                      {c.totalScore}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">{c.aiSummary}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Smart Send</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Message Type</Label>
              <Select value={messageType} onValueChange={(v: MessageType) => { setMessageType(v); setCustomMessage(messageTemplates[v]); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualified">Qualified for Next Round</SelectItem>
                  <SelectItem value="interview">Interview Invitation</SelectItem>
                  <SelectItem value="rejection">Rejection Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message Preview</Label>
              <Textarea className="min-h-[150px] text-sm" value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} />
              <p className="text-xs text-muted-foreground">Use {"{name}"} for candidate name personalization</p>
            </div>
            <p className="text-sm text-muted-foreground">Sending to <strong>{selected.length}</strong> candidate(s)</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSend}>
              <Send className="h-4 w-4 mr-1" /> Send Messages
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EvaluateCandidates;
