import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Eye, XCircle, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

const PreviousAssessments = () => {
  const { companyId } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<(Tables<"assessments"> & { candidateCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!companyId) return;
    const fetch = async () => {
      const { data } = await supabase.from("assessments").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
      if (data) {
        const withCounts = await Promise.all(
          data.map(async (a) => {
            const { count } = await supabase.from("candidates").select("*", { count: "exact", head: true }).eq("assessment_id", a.id);
            return { ...a, candidateCount: count || 0 };
          })
        );
        setAssessments(withCounts);
      }
      setLoading(false);
    };
    fetch();
  }, [companyId]);

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/take/${id}`);
    toast.success("Link copied!");
  };

  const closeAssessment = async (id: string) => {
    await supabase.from("assessments").update({ status: "closed" }).eq("id", id);
    setAssessments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "closed" } : a)));
    toast.success("Assessment closed");
  };

  const deleteAssessment = async (id: string) => {
    // Delete related data first, then the assessment
    await supabase.from("questions").delete().eq("assessment_id", id);
    const { data: candidates } = await supabase.from("candidates").select("id").eq("assessment_id", id);
    if (candidates?.length) {
      const candIds = candidates.map((c) => c.id);
      await supabase.from("candidate_responses").delete().in("candidate_id", candIds);
      await supabase.from("candidate_scores").delete().in("candidate_id", candIds);
      await supabase.from("anticheat_logs").delete().in("candidate_id", candIds);
      await supabase.from("candidates").delete().eq("assessment_id", id);
    }
    await supabase.from("assessments").delete().eq("id", id);
    setAssessments((prev) => prev.filter((a) => a.id !== id));
    toast.success("Assessment deleted");
  };

  const filtered = assessments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) || a.role.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold mb-1">Previous Assessments</h1>
        <p className="text-muted-foreground text-sm mb-6">Manage and review your created assessments</p>
      </motion.div>

      {assessments.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">No assessments yet. Create your first one!</div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search assessments..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Assessment</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Created</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Candidates</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a, i) => (
                    <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="p-3 font-medium">{a.title}</td>
                      <td className="p-3">{a.role}</td>
                      <td className="p-3 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                      <td className="p-3">{a.candidateCount}</td>
                      <td className="p-3"><Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge></td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(`/app/assessments/${a.id}`)}><Eye className="h-3 w-3 mr-1" /> View</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => copyLink(a.id)}><Copy className="h-3 w-3 mr-1" /> Copy Link</Button>
                          {a.status === "active" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive"><XCircle className="h-3 w-3 mr-1" /> Close</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Close assessment?</AlertDialogTitle>
                                  <AlertDialogDescription>This will prevent new candidates from taking this assessment. Existing results will be preserved.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => closeAssessment(a.id)}>Close Assessment</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive"><Trash2 className="h-3 w-3" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete assessment?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete this assessment and all associated data including candidate responses and scores. This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteAssessment(a.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PreviousAssessments;
