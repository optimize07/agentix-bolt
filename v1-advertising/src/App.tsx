import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { DocumentParsingProvider } from "@/contexts/DocumentParsingContext";
import { DocumentParsingQueue } from "@/components/DocumentParsingQueue";
import Dashboard from "./pages/Dashboard";
import Overview from "./pages/Overview";
import Analytics from "./pages/Analytics";
import Projects from "./pages/Projects";
import Agents from "./pages/Agents";
import AdCreator from "./pages/AdCreator";
import AiCmo from "./pages/AiCmo";
import CampaignManager from "./pages/CampaignManager";
import AdSpy from "./pages/AdSpy";
import AdOptimizer from "./pages/AdOptimizer";
import MarketResearch from "./pages/MarketResearch";
import KnowledgeBase from "./pages/KnowledgeBase";
import AssetLibrary from "./pages/AssetLibrary";
import Offers from "./pages/Offers";
import PromptLibrary from "./pages/PromptLibrary";
import Strategy from "./pages/Strategy";
import Tools from "./pages/Tools";
import BrandSettings from "./pages/BrandSettings";
import BoardLayout from "./pages/board/BoardLayout";
import Chat from "./pages/board/Chat";
import CanvasV2 from "./pages/board/CanvasV2";
import Kanban from "./pages/board/Kanban";
import Settings from "./pages/board/Settings";
import CreativeMockups from "./pages/CreativeMockups";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ProjectProvider>
        <DocumentParsingProvider>
          <Toaster />
          <Sonner />
          <DocumentParsingQueue />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />}>
                <Route index element={<Navigate to="/overview" replace />} />
                <Route path="overview" element={<Overview />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="projects" element={<Projects />} />
                
                {/* Board Routes */}
                <Route path="projects/:boardId" element={<BoardLayout />}>
                  <Route index element={<Navigate to="chat" replace />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="canvas" element={<CanvasV2 />} />
                  <Route path="kanban" element={<Kanban />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                
                <Route path="agents" element={<Agents />} />
                <Route path="ad-creator" element={<AdCreator />} />
                <Route path="ai-cmo" element={<AiCmo />} />
                <Route path="campaigns" element={<CampaignManager />} />
                <Route path="ad-spy" element={<AdSpy />} />
                <Route path="ad-optimizer" element={<AdOptimizer />} />
                <Route path="market-research" element={<MarketResearch />} />
                <Route path="central-brain" element={<KnowledgeBase />} />
                <Route path="creative-mockups" element={<CreativeMockups />} />
                
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DocumentParsingProvider>
      </ProjectProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
