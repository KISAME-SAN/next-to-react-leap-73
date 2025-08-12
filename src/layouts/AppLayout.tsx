import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
const AppLayout = () => {
  const location = useLocation();
  const [sidebarHidden, setSidebarHidden] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarHidden");
    setSidebarHidden(saved === "1");
  }, []);

  const toggleSidebar = () => {
    setSidebarHidden((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarHidden", next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground flex">
      <Sidebar collapsed={sidebarHidden} />
      <main className="relative flex-1 h-full overflow-y-auto bg-background">
        <div className="absolute top-2 left-2 z-20">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            aria-label={sidebarHidden ? "Afficher le menu" : "Masquer le menu"}
          >
            {sidebarHidden ? <PanelRight className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
        </div>
        <div key={location.pathname} className="max-w-7xl mx-auto p-6 animate-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
