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
import Calendar from "./pages/Calendar";
import Launch from "./pages/Launch";
import Projects from "./pages/Projects";
import Ideation from "./pages/Ideation";
import AiCmo from "./pages/AiCmo";
import Offers from "./pages/Offers";
import Copy from "./pages/Copy";
import Funnel from "./pages/Funnel";
import KnowledgeBase from "./pages/KnowledgeBase";
import BoardLayout from "./pages/board/BoardLayout";
import Chat from "./pages/board/Chat";
import CanvasV2 from "./pages/board/CanvasV2";
import Kanban from "./pages/board/Kanban";
import Settings from "./pages/board/Settings";
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
                
                {/* Main Dashboard */}
                <Route path="overview" element={<Overview />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="launch" element={<Launch />} />
                
                {/* Studio */}
                <Route path="projects" element={<Projects />} />
                <Route path="projects/:boardId" element={<BoardLayout />}>
                  <Route index element={<Navigate to="chat" replace />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="canvas" element={<CanvasV2 />} />
                  <Route path="kanban" element={<Kanban />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="ideation" element={<Ideation />} />
                <Route path="ai-cmo" element={<AiCmo />} />
                
                {/* Campaigns */}
                <Route path="offers" element={<Offers />} />
                <Route path="copy" element={<Copy />} />
                <Route path="funnel" element={<Funnel />} />
                
                {/* Central Brain */}
                <Route path="central-brain" element={<KnowledgeBase />} />
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
