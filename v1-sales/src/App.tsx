import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import Actions from "./pages/Actions";
import DataEntry from "./pages/DataEntry";
import Targets from "./pages/Targets";
import Leaderboards from "./pages/Leaderboards";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <OrganizationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/actions" element={<Actions />} />
            <Route path="/data-entry" element={<DataEntry />} />
            <Route path="/targets" element={<Targets />} />
            <Route path="/leaderboards" element={<Leaderboards />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Redirect old routes to Settings tabs */}
            <Route path="/organization" element={<Navigate to="/settings?tab=organization" replace />} />
            <Route path="/forms-management" element={<Navigate to="/settings?tab=forms" replace />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </OrganizationProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
