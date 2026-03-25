import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import FunnelBuilder from "@/components/funnel/FunnelBuilder";
import { toast } from "@/hooks/use-toast";

export default function FunnelBuilderPage() {
  const [fields, setFields] = useState<any[]>([]);

  const handleSave = () => {
    toast({ title: "✓ Funnel sauvegardé", description: `${fields.length} champ(s) configurés` });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Funnel Builder"
        subtitle="Construisez votre formulaire de candidature par glisser-déposer"
        actions={
          <GhButton onClick={handleSave} disabled={fields.length === 0}>
            💾 Sauvegarder le funnel
          </GhButton>
        }
      />
      <FunnelBuilder fields={fields} onChange={setFields} />
    </motion.div>
  );
}
