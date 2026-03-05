import { useState } from "react";
import { mockAssessments } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Eye, XCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const PreviousAssessments = () => {
  const [assessments, setAssessments] = useState(mockAssessments);

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${link}`);
    toast.success("Link copied!");
  };

  const closeAssessment = (id: string) => {
    setAssessments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "closed" as const } : a)));
    toast.success("Assessment closed");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold mb-1">Previous Assessments</h1>
        <p className="text-muted-foreground text-sm mb-6">Manage and review your created assessments</p>
      </motion.div>

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
              {assessments.map((a, i) => (
                <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="p-3 font-medium">{a.title}</td>
                  <td className="p-3">{a.role}</td>
                  <td className="p-3 text-muted-foreground">{a.createdAt}</td>
                  <td className="p-3">{a.candidateCount}</td>
                  <td className="p-3">
                    <Badge variant={a.status === "active" ? "default" : "secondary"}>
                      {a.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => copyLink(a.link)}>
                        <Copy className="h-3 w-3 mr-1" /> Copy Link
                      </Button>
                      {a.status === "active" && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => closeAssessment(a.id)}>
                          <XCircle className="h-3 w-3 mr-1" /> Close
                        </Button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PreviousAssessments;
