import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 7;

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < DISMISS_DAYS * 24 * 3600 * 1000) return;

    // Already installed (standalone)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      toast({ title: "✓ Application installée" });
    }
    setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-card border border-border rounded-xl shadow-2xl p-4 space-y-3 animate-in slide-in-from-bottom-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Download size={16} className="text-primary" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-foreground">Installer Grow Hub</div>
            <div className="text-[11px] text-muted-foreground">Accès rapide depuis ton bureau</div>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1">
          <X size={14} />
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleDismiss}
          className="flex-1 text-[12px] px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-secondary"
        >
          Plus tard
        </button>
        <button
          onClick={handleInstall}
          className="flex-1 text-[12px] px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          Installer
        </button>
      </div>
    </div>
  );
}
