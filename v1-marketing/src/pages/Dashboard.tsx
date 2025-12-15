import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { seedSampleData } from "@/lib/seedData";

export default function Dashboard() {
  useEffect(() => {
    seedSampleData();
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />

      <main className="flex-1 flex flex-col overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
