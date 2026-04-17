import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ROUTES: Record<string, string> = {
  d: "/app/dashboard",
  s: "/app/entreprises",
  p: "/app/projets",
  c: "/app/coaching",
  e: "/app/evenements",
  t: "/app/taches",
  g: "/app/grants",
  l: "/app/lms",
  a: "/app/analytics",
  m: "/app/messagerie",
};

/**
 * Global keyboard shortcuts. Press "g" then a key to navigate.
 * Examples: g+d → Dashboard, g+s → Startups, g+p → Projects.
 * Also handles Cmd/Ctrl+K for global search (handled by SearchDialog itself).
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    let lastG = 0;
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "g") {
        lastG = Date.now();
        return;
      }

      // Within 1.2s after pressing 'g'
      if (Date.now() - lastG < 1200) {
        const route = ROUTES[e.key.toLowerCase()];
        if (route) {
          e.preventDefault();
          navigate(route);
          lastG = 0;
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [navigate]);
}

export const SHORTCUT_HINTS: { key: string; label: string }[] = [
  { key: "g d", label: "Dashboard" },
  { key: "g s", label: "Entreprises" },
  { key: "g p", label: "Projets" },
  { key: "g c", label: "Coaching" },
  { key: "g e", label: "Événements" },
  { key: "g t", label: "Tâches" },
  { key: "g g", label: "Grants" },
  { key: "g l", label: "LMS" },
  { key: "g a", label: "Analytics" },
  { key: "g m", label: "Messagerie" },
  { key: "⌘ K", label: "Recherche globale" },
];
