import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function AppLayout() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useRealtimeNotifications();

  return (
    <div className="min-h-screen relative z-[1]">
      {isMobile ? (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[240px] bg-card border-border">
            <AppSidebar mobile onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      ) : (
        <AppSidebar />
      )}
      <div className={`${isMobile ? "" : "ml-[240px]"} min-h-screen flex flex-col`}>
        <AppTopbar onToggleSidebar={() => setSidebarOpen(true)} showMenuButton={isMobile} />
        <main className="flex-1 p-4 md:p-7 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
