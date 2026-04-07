import { useState, useRef } from "react";
import GhButton from "@/components/shared/GhButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CertificateDialogProps {
  startupName: string;
  programName?: string;
  cohortName?: string;
  alumniDate?: string;
}

export default function CertificateDialog({ startupName, programName, cohortName, alumniDate }: CertificateDialogProps) {
  const [open, setOpen] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const formattedDate = alumniDate
    ? new Date(alumniDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !certRef.current) return;
    printWindow.document.write(`
      <html><head><title>Certificat - ${startupName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
        @media print { body { background: white; } .cert { box-shadow: none !important; } }
      </style></head><body>
      ${certRef.current.outerHTML}
      <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GhButton variant="secondary" size="sm">🎓 Certificat</GhButton>
      </DialogTrigger>
      <DialogContent className="max-w-[700px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Attestation de participation</DialogTitle>
        </DialogHeader>

        <div ref={certRef} className="cert bg-white rounded-xl border-2 border-primary/20 p-8 text-center" style={{ fontFamily: "'Inter', sans-serif", color: "#1a1a2e" }}>
          {/* Border decoration */}
          <div style={{ border: "3px double #1a6b4a", borderRadius: 12, padding: 32 }}>
            {/* Header */}
            <div style={{ fontSize: 12, letterSpacing: 4, textTransform: "uppercase", color: "#6b7280", marginBottom: 8 }}>
              Grow Hub Management System
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#1a6b4a", marginBottom: 4 }}>
              Attestation de Participation
            </div>
            <div style={{ width: 60, height: 2, background: "#1a6b4a", margin: "12px auto 24px" }} />

            {/* Body */}
            <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 20 }}>
              <p>Nous certifions que</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#1a1a2e", margin: "8px 0" }}>
                {startupName}
              </p>
              <p>a complété avec succès le programme d'accélération</p>
              {programName && (
                <p style={{ fontSize: 18, fontWeight: 600, color: "#1a6b4a", margin: "8px 0" }}>
                  {programName}
                </p>
              )}
              {cohortName && (
                <p style={{ fontSize: 13, color: "#6b7280" }}>Cohorte : {cohortName}</p>
              )}
            </div>

            {/* Date */}
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 24 }}>
              Délivré le {formattedDate}
            </div>

            {/* Signatures */}
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: 40, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
              <div>
                <div style={{ width: 120, borderBottom: "1px solid #9ca3af", marginBottom: 8 }} />
                <div style={{ fontSize: 11, color: "#6b7280" }}>Directeur du programme</div>
              </div>
              <div>
                <div style={{ width: 120, borderBottom: "1px solid #9ca3af", marginBottom: 8 }} />
                <div style={{ fontSize: 11, color: "#6b7280" }}>Coordinateur</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-3">
          <GhButton variant="primary" onClick={handlePrint}>🖨 Imprimer / PDF</GhButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
