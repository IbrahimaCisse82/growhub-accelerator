import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

export default function NotFound() {
  const location = useLocation();
  useEffect(() => {
    console.error("404 Error:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-display font-bold text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">Page introuvable</p>
        <p className="text-sm text-muted-foreground">La page <code className="text-primary">{location.pathname}</code> n'existe pas.</p>
        <Link to="/app/dashboard" className="inline-block mt-4 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all">
          Retour au Dashboard
        </Link>
      </div>
    </div>
  );
}
