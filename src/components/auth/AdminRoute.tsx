import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/** Protects admin-only routes. Redirects non-admins to dashboard. */
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/app/dashboard" replace />;

  return <>{children}</>;
}
