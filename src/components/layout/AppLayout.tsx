import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen relative z-[1]">
      <AppSidebar />
      <div className="ml-[240px] min-h-screen flex flex-col">
        <AppTopbar />
        <main className="flex-1 p-7 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
