import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

const SettingsPage = () => (
  <div className="p-6 max-w-2xl mx-auto">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-semibold mb-1">Settings</h1>
      <p className="text-muted-foreground text-sm mb-8">Manage your account and company settings</p>
    </motion.div>

    <div className="glass-card p-6 space-y-6">
      <div>
        <h3 className="font-medium mb-4">Company Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input defaultValue="Acme Inc." />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input defaultValue="Technology" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Company Website</Label>
            <Input defaultValue="https://acme.com" />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-medium mb-4">Account</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue="admin@acme.com" />
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input defaultValue="John Doe" />
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button>Save Changes</Button>
      </div>
    </div>
  </div>
);

export default SettingsPage;
