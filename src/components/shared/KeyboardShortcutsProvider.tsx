import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

/** Mounts global keyboard shortcuts (must live inside Router). */
export default function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();
  return <>{children}</>;
}
