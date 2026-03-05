import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SettingsPage = () => {
  const { companyId, companyName, user } = useAuth();
  const [name, setName] = useState(companyName || "");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    const { error } = await supabase.from("companies").update({
      company_name: name,
      industry,
      website,
    }).eq("id", companyId);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Settings saved!");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm mb-8">Manage your account and company settings</p>
      </motion.div>

      <div className="glass-card p-6 space-y-6">
        <div>
          <h3 className="font-medium mb-4">Company Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Company Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Industry</Label><Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Technology" /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Company Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://company.com" /></div>
          </div>
        </div>
        <Separator />
        <div>
          <h3 className="font-medium mb-4">Account</h3>
          <div className="space-y-2"><Label>Email</Label><Input disabled value={user?.email || ""} /></div>
        </div>
        <Separator />
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
