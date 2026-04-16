import { useState, useRef } from "react";
import GhButton from "@/components/shared/GhButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award } from "lucide-react";

interface CourseCertificateDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentName: string;
  courseTitle: string;
  completedAt?: string;
  modulesCount?: number;
  durationHours?: number;
}

export default function CourseCertificateDialog({
  open, onOpenChange, studentName, courseTitle, completedAt, modulesCount, durationHours,
}: CourseCertificateDialogProps) {
  const certRef = useRef<HTMLDivElement>(null);

  const formattedDate = completedAt
    ? new Date(completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const certId = `GH-LMS-${Date.now().toString(36).toUpperCase()}`;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !certRef.current) return;
    printWindow.document.write(`
      <html><head><title>Certificat - ${courseTitle}</title>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[750px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Award size={18} className="text-primary" /> Certificat de complétion
          </DialogTitle>
        </DialogHeader>

        <div ref={certRef} className="cert bg-white rounded-xl p-1" style={{ fontFamily: "'Inter', sans-serif", color: "#1a1a2e" }}>
          <div style={{ border: "3px double #1a6b4a", borderRadius: 12, padding: 36, position: "relative", overflow: "hidden" }}>
            {/* Decorative corners */}
            <div style={{ position: "absolute", top: 8, left: 8, width: 40, height: 40, borderTop: "2px solid #1a6b4a", borderLeft: "2px solid #1a6b4a", borderRadius: "8px 0 0 0" }} />
            <div style={{ position: "absolute", top: 8, right: 8, width: 40, height: 40, borderTop: "2px solid #1a6b4a", borderRight: "2px solid #1a6b4a", borderRadius: "0 8px 0 0" }} />
            <div style={{ position: "absolute", bottom: 8, left: 8, width: 40, height: 40, borderBottom: "2px solid #1a6b4a", borderLeft: "2px solid #1a6b4a", borderRadius: "0 0 0 8px" }} />
            <div style={{ position: "absolute", bottom: 8, right: 8, width: 40, height: 40, borderBottom: "2px solid #1a6b4a", borderRight: "2px solid #1a6b4a", borderRadius: "0 0 8px 0" }} />

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "#6b7280", marginBottom: 6 }}>
                Grow Hub Academy
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: "#1a6b4a", marginBottom: 4 }}>
                Certificat de Complétion
              </div>
              <div style={{ width: 80, height: 2, background: "linear-gradient(90deg, transparent, #1a6b4a, transparent)", margin: "14px auto 28px" }} />

              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Ce certificat est décerné à</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#1a1a2e", margin: "8px 0 20px" }}>
                {studentName}
              </div>

              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>pour avoir complété avec succès le cours</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: "#1a6b4a", margin: "8px 0 16px", lineHeight: 1.3 }}>
                {courseTitle}
              </div>

              {(modulesCount || durationHours) && (
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>
                  {modulesCount ? `${modulesCount} modules` : ""}
                  {modulesCount && durationHours ? " · " : ""}
                  {durationHours ? `${durationHours}h de formation` : ""}
                </div>
              )}

              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 24 }}>
                Délivré le {formattedDate}
              </div>
              <div style={{ fontSize: 10, color: "#d1d5db", marginTop: 4 }}>
                Réf. {certId}
              </div>

              <div style={{ display: "flex", justifyContent: "space-around", marginTop: 36, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
                <div>
                  <div style={{ width: 130, borderBottom: "1px solid #9ca3af", marginBottom: 8 }} />
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Directeur de la formation</div>
                </div>
                <div>
                  <div style={{ width: 130, borderBottom: "1px solid #9ca3af", marginBottom: 8 }} />
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Coordinateur pédagogique</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-3">
          <GhButton variant="ghost" onClick={() => onOpenChange(false)}>Fermer</GhButton>
          <GhButton variant="primary" onClick={handlePrint}>
            <Award size={13} className="mr-1.5" /> Imprimer / PDF
          </GhButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
