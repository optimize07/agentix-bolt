import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarToggleProvider } from "@/hooks/use-sidebar-toggle";
import { SidebarToggleOverlay } from "@/components/SidebarToggleOverlay";
import { ProtectedRoute, AdminRoute, AuthRedirect } from "@/components/ProtectedRoute";
import { UserProvider } from "@/contexts/UserContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { DocumentParsingProvider } from "@/contexts/DocumentParsingContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Advertising from "./pages/Advertising";
import MarketResearch from "./pages/MarketResearch";
import AdOptimizer from "./pages/AdOptimizer";
import AdOptimizerRunDetails from "./pages/AdOptimizerRunDetails";
import AdSpy from "./pages/AdSpy";
import AdSpyNew from "./pages/AdSpyNew";
import AgentProjects from "./pages/AgentProjects";
import CentralBrain from "./pages/CentralBrain";
import CampaignManager from "./pages/advertising/CampaignManager";
import AdCreatorDashboard from "./pages/advertising/AdCreatorDashboard";
import Auth from "./pages/Auth";
import AuthInvite from "./pages/AuthInvite";
import NotFound from "./pages/NotFound";
import Department from "./pages/Department";
import OperationsAgents from "./pages/OperationsAgents";
import MarketingAgents from "./pages/MarketingAgents";
import MarketingAdSpy from "./pages/marketing/MarketingAdSpy";
import MarketingMarketResearch from "./pages/marketing/MarketingMarketResearch";
import MarketingAdCreator from "./pages/marketing/MarketingAdCreator";
import LandingPageCopywriter from "./pages/marketing/LandingPageCopywriter";
import EmailCopywriter from "./pages/marketing/EmailCopywriter";
import MarketingProjects from "./pages/marketing/Projects";
import MarketingIdeation from "./pages/marketing/Ideation";
import MarketingOffers from "./pages/marketing/Offers";
import MarketingCopy from "./pages/marketing/Copy";
import MarketingFunnel from "./pages/marketing/Funnel";
import MarketingBoardPage from "./pages/marketing/BoardPage";
import AdvertisingAgents from "./pages/AdvertisingAgents";
import Marketing from "./pages/Marketing";
import Operations from "./pages/Operations";
import OperationsAnalytics from "./pages/OperationsAnalytics";
import OperationsProjects from "./pages/OperationsProjects";
import OperationsAutomation from "./pages/OperationsAutomation";
import OperationsResourceOptimization from "./pages/OperationsResourceOptimization";
import OperationsQualityControl from "./pages/OperationsQualityControl";
import ProjectDetail from "./pages/operations/ProjectDetail";
import FinancialsComingSoon from "./pages/FinancialsComingSoon";
import FinancialAgents from "./pages/FinancialAgents";
import FinancialsAnalytics from "./pages/FinancialsAnalytics";
import FinancialsProjects from "./pages/FinancialsProjects";
import FinancialsReports from "./pages/FinancialsReports";
import Sales from "./pages/Sales";
import SalesAgents from "./pages/SalesAgents";
import SalesAnalytics from "./pages/SalesAnalytics";
import SalesProjects from "./pages/SalesProjects";
import SalesPipeline from "./pages/SalesPipeline";
import SalesCallScripts from "./pages/SalesCallScripts";
import SalesCrmIntegration from "./pages/SalesCrmIntegration";
import SalesSettings from "./pages/SalesSettings";
import StrategyComingSoon from "./pages/StrategyComingSoon";
import StrategyAgents from "./pages/StrategyAgents";
import StrategyMarketPositioning from "./pages/StrategyMarketPositioning";
import StrategyKnowledgeBases from "./pages/StrategyKnowledgeBases";
import StrategyCompanyBrain from "./pages/StrategyCompanyBrain";
import KnowledgeBaseBrowser from "./pages/KnowledgeBaseBrowser";
import AgencyCentralBrain from "./pages/AgencyCentralBrain";
import ClientSettings from "./pages/ClientSettings";
import ClientAgentController from "./pages/ClientAgentController";
import ClientProjects from "./pages/ClientProjects";
import ClientKnowledge from "./pages/ClientKnowledge";
import ClientCentralBrain from "./pages/ClientCentralBrain";
import SystemControl from "./pages/SystemControl";
import AdminSettings from "./pages/AdminSettings";
import AdminNotifications from "./pages/AdminNotifications";
import AdminClients from "./pages/AdminClients";
import AdminFeatureToggles from "./pages/AdminFeatureToggles";
import AdminAgentRuns from "./pages/AdminAgentRuns";
import AdminAgentController from "./pages/AdminAgentController";
import Calendar from "./pages/Calendar";
import Launch from "./pages/Launch";

import BoardLayout from "./pages/board/BoardLayout";
import BoardChat from "./pages/board/Chat";
import BoardCanvas from "./pages/board/Canvas";
import BoardKanban from "./pages/board/Kanban";
import BoardSettings from "./pages/board/Settings";
import AdvertisingBoardPage from "./pages/AdvertisingBoardPage";
import AdvertisingProjectDetail from "./pages/advertising/AdvertisingProjectDetail";

const queryClient = new QueryClient();
const ClientAnalytics = lazy(() => import("./pages/ClientAnalytics"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const BoardCanvas2 = lazy(() => import("./pages/board/Canvas2Page"));
const AdminCalendar = lazy(() => import("./pages/AdminCalendar"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <UserProvider>
            <ProjectProvider>
              <DocumentParsingProvider>
                <SidebarToggleProvider>
                  <SidebarToggleOverlay />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/invite" element={<AuthInvite />} />
              <Route path="/" element={<AuthRedirect />} />
          <Route path="/client/:clientId" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          {/* Client-level quick access routes (must be above department catch-all) */}
          <Route path="/client/:clientId/settings" element={<ProtectedRoute><ClientSettings /></ProtectedRoute>} />
              <Route path="/client/:clientId/agents" element={<ProtectedRoute><ClientAgentController /></ProtectedRoute>} />
          <Route path="/client/:clientId/projects" element={<ProtectedRoute><ClientProjects /></ProtectedRoute>} />
          <Route path="/client/:clientId/knowledge" element={<ProtectedRoute><ClientKnowledge /></ProtectedRoute>} />
          <Route path="/client/:clientId/central-brain" element={<ProtectedRoute><ClientCentralBrain /></ProtectedRoute>} />
          <Route
            path="/client/:clientId/analytics"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="p-6 text-muted-foreground">Loading analytics...</div>}>
                  <ClientAnalytics />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="/client/:clientId/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/client/:clientId/launch" element={<ProtectedRoute><Launch /></ProtectedRoute>} />
          <Route path="/client/:clientId/system" element={<ProtectedRoute><SystemControl /></ProtectedRoute>} />
          <Route path="/client/:clientId/advertising" element={<ProtectedRoute><Advertising /></ProtectedRoute>} />
          <Route path="/client/:clientId/advertising/market-research" element={<ProtectedRoute><MarketResearch /></ProtectedRoute>} />
          <Route path="/client/:clientId/advertising/ad-optimizer" element={<ProtectedRoute><AdOptimizer /></ProtectedRoute>} />
          <Route path="/client/:clientId/advertising/ad-optimizer/run/:runId" element={<ProtectedRoute><AdOptimizerRunDetails /></ProtectedRoute>} />
          <Route path="/client/:clientId/advertising/ad-spy" element={<ProtectedRoute><AdSpyNew /></ProtectedRoute>} />
          <Route path="/client/:clientId/advertising/ad-creator" element={<ProtectedRoute><AdCreatorDashboard /></ProtectedRoute>} />
          <Route path="/client/:clientId/advertising/campaign-manager" element={<ProtectedRoute><CampaignManager /></ProtectedRoute>} />
          <Route path="/client/:clientId/advertising/agents" element={<ProtectedRoute><AdvertisingAgents /></ProtectedRoute>} />
          <Route path="/client/:clientId/advertising/projects" element={<ProtectedRoute><AgentProjects /></ProtectedRoute>} />
          <Route path="/client/:clientId/advertising/projects/:boardId" element={<ProtectedRoute><AdvertisingBoardPage /></ProtectedRoute>}>
            <Route index element={<Navigate to="chat" replace />} />
            <Route path="chat" element={<BoardChat />} />
            <Route path="canvas" element={<BoardCanvas />} />
            <Route
              path="canvas2"
              element={
                <Suspense fallback={<div className="p-4 text-muted-foreground">Loading canvas...</div>}>
                  <BoardCanvas2 />
                </Suspense>
              }
            />
            <Route path="kanban" element={<BoardKanban />} />
            <Route path="settings" element={<BoardSettings />} />
          </Route>
          {/* Strategy dedicated area */}
          <Route path="/client/:clientId/strategy" element={<ProtectedRoute><StrategyComingSoon /></ProtectedRoute>} />
          <Route path="/client/:clientId/strategy/agents" element={<ProtectedRoute><StrategyAgents /></ProtectedRoute>} />
          <Route path="/client/:clientId/strategy/market-positioning" element={<ProtectedRoute><StrategyMarketPositioning /></ProtectedRoute>} />
          <Route path="/client/:clientId/strategy/knowledge-bases" element={<ProtectedRoute><StrategyKnowledgeBases /></ProtectedRoute>} />
          <Route path="/client/:clientId/strategy/company-brain" element={<ProtectedRoute><StrategyCompanyBrain /></ProtectedRoute>} />
          <Route path="/client/:clientId/knowledge-browser" element={<ProtectedRoute><KnowledgeBaseBrowser /></ProtectedRoute>} />
          {/* Sales dedicated area */}
          <Route path="/client/:clientId/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
          <Route path="/client/:clientId/sales/dashboard" element={<ProtectedRoute><Navigate to="/client/:clientId/sales" replace /></ProtectedRoute>} />
          <Route path="/client/:clientId/sales/analytics" element={<ProtectedRoute><SalesAnalytics /></ProtectedRoute>} />
          <Route path="/client/:clientId/sales/projects" element={<ProtectedRoute><SalesProjects /></ProtectedRoute>} />
          <Route path="/client/:clientId/sales/agents" element={<ProtectedRoute><SalesAgents /></ProtectedRoute>} />
          <Route path="/client/:clientId/sales/pipeline" element={<ProtectedRoute><SalesPipeline /></ProtectedRoute>} />
          <Route path="/client/:clientId/sales/call-scripts" element={<ProtectedRoute><SalesCallScripts /></ProtectedRoute>} />
          <Route path="/client/:clientId/sales/crm-integration" element={<ProtectedRoute><Navigate to="/client/:clientId/sales/settings" replace /></ProtectedRoute>} />
          <Route path="/client/:clientId/sales/settings" element={<ProtectedRoute><SalesSettings /></ProtectedRoute>} />
          {/* Operations dedicated area */}
          <Route path="/client/:clientId/operations" element={<ProtectedRoute><Operations /></ProtectedRoute>} />
          <Route path="/client/:clientId/operations/analytics" element={<ProtectedRoute><OperationsAnalytics /></ProtectedRoute>} />
          <Route path="/client/:clientId/operations/projects" element={<ProtectedRoute><OperationsProjects /></ProtectedRoute>} />
          <Route path="/client/:clientId/operations/agents" element={<ProtectedRoute><OperationsAgents /></ProtectedRoute>} />
          <Route path="/client/:clientId/operations/automation" element={<ProtectedRoute><OperationsAutomation /></ProtectedRoute>} />
          <Route path="/client/:clientId/operations/resource-optimization" element={<ProtectedRoute><OperationsResourceOptimization /></ProtectedRoute>} />
          <Route path="/client/:clientId/operations/quality-control" element={<ProtectedRoute><OperationsQualityControl /></ProtectedRoute>} />
          <Route path="/client/:clientId/operations/projects/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          {/* Back-compat alias */}
          <Route path="/client/:clientId/operations-agents" element={<ProtectedRoute><Navigate to="/client/:clientId/operations/agents" replace /></ProtectedRoute>} />
          {/* Marketing dedicated area */}
          <Route path="/client/:clientId/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
          <Route path="/client/:clientId/marketing/overview" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
          <Route path="/client/:clientId/marketing/launch" element={<ProtectedRoute><Launch /></ProtectedRoute>} />
          <Route path="/client/:clientId/marketing/projects" element={<ProtectedRoute><MarketingProjects /></ProtectedRoute>} />
          <Route path="/client/:clientId/marketing/ideation" element={<ProtectedRoute><MarketingIdeation /></ProtectedRoute>} />
          <Route path="/client/:clientId/marketing/agents" element={<ProtectedRoute><MarketingAgents /></ProtectedRoute>} />
          <Route path="/client/:clientId/marketing/ad-spy" element={<ProtectedRoute><AdSpyNew /></ProtectedRoute>} />
          <Route path="/client/:clientId/marketing/market-research" element={<ProtectedRoute><MarketingMarketResearch /></ProtectedRoute>} />
          <Route path="/client/:clientId/marketing/ad-creator" element={<ProtectedRoute><MarketingAdCreator /></ProtectedRoute>} />
          <Route path="/client/:clientId/marketing/landing-page-copywriter" element={<ProtectedRoute><LandingPageCopywriter /></ProtectedRoute>} />
          <Route path="/client/:clientId/marketing/email-copywriter" element={<ProtectedRoute><EmailCopywriter /></ProtectedRoute>} />
          <Route path="/client/:clientId/marketing/offers" element={<ProtectedRoute><MarketingOffers /></ProtectedRoute>} />
          <Route path="/client/:clientId/marketing/copy" element={<ProtectedRoute><MarketingCopy /></ProtectedRoute>} />
          <Route path="/client/:clientId/marketing/funnel" element={<ProtectedRoute><MarketingFunnel /></ProtectedRoute>} />
          <Route path="/client/:clientId/marketing/projects/:boardId" element={<ProtectedRoute><MarketingBoardPage /></ProtectedRoute>}>
            <Route index element={<Navigate to="chat" replace />} />
            <Route path="chat" element={<BoardChat />} />
            <Route path="canvas" element={<BoardCanvas />} />
            <Route
              path="canvas2"
              element={
                <Suspense fallback={<div className="p-4 text-muted-foreground">Loading canvas...</div>}>
                  <BoardCanvas2 />
                </Suspense>
              }
            />
            <Route path="kanban" element={<BoardKanban />} />
            <Route path="settings" element={<BoardSettings />} />
          </Route>
          {/* Back-compat alias */}
          <Route path="/client/:clientId/marketing-agents" element={<ProtectedRoute><Navigate to="/client/:clientId/marketing/agents" replace /></ProtectedRoute>} />
          {/* Financials dedicated area */}
          <Route path="/client/:clientId/financials" element={<ProtectedRoute><FinancialsComingSoon /></ProtectedRoute>} />
          <Route path="/client/:clientId/financials/agents" element={<ProtectedRoute><FinancialAgents /></ProtectedRoute>} />
          <Route path="/client/:clientId/financials/analytics" element={<ProtectedRoute><FinancialsAnalytics /></ProtectedRoute>} />
          <Route path="/client/:clientId/financials/projects" element={<ProtectedRoute><FinancialsProjects /></ProtectedRoute>} />
          <Route path="/client/:clientId/financials/reports" element={<ProtectedRoute><FinancialsReports /></ProtectedRoute>} />
          {/* Operations-style alias for Agents direct link */}
          <Route path="/client/:clientId/financial-agents" element={<ProtectedRoute><FinancialAgents /></ProtectedRoute>} />
          {/* Generic department route (after specific advertising/marketing routes) */}
          <Route path="/client/:clientId/:departmentId" element={<ProtectedRoute><Department /></ProtectedRoute>} />
          {/* New Agent Projects and Central Brain routes */}
          <Route path="/agent-projects" element={<ProtectedRoute><AgentProjects /></ProtectedRoute>} />
          <Route path="/ad-spy" element={<ProtectedRoute><AdSpyNew /></ProtectedRoute>} />
          <Route path="/central-brain" element={<ProtectedRoute><CentralBrain /></ProtectedRoute>} />
          <Route path="/knowledge-base" element={<ProtectedRoute><KnowledgeBaseBrowser /></ProtectedRoute>} />
          {/* Board routes with nested tabs */}
          <Route path="/projects/:boardId" element={<ProtectedRoute><BoardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="chat" replace />} />
            <Route path="chat" element={<BoardChat />} />
            <Route path="canvas" element={<BoardCanvas />} />
            <Route
              path="canvas2"
              element={
                <Suspense fallback={<div className="p-4 text-muted-foreground">Loading canvas...</div>}>
                  <BoardCanvas2 />
                </Suspense>
              }
            />
            <Route path="kanban" element={<BoardKanban />} />
            <Route path="settings" element={<BoardSettings />} />
          </Route>
          {/* Client-scoped board routes */}
          <Route path="/client/:clientId/projects/:boardId" element={<ProtectedRoute><BoardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="chat" replace />} />
            <Route path="chat" element={<BoardChat />} />
            <Route path="canvas" element={<BoardCanvas />} />
            <Route
              path="canvas2"
              element={
                <Suspense fallback={<div className="p-4 text-muted-foreground">Loading canvas...</div>}>
                  <BoardCanvas2 />
                </Suspense>
              }
            />
            <Route path="kanban" element={<BoardKanban />} />
            <Route path="settings" element={<BoardSettings />} />
          </Route>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Suspense fallback={<div className="p-6 text-muted-foreground">Loading admin dashboard...</div>}>
                  <AdminDashboard />
                </Suspense>
              </AdminRoute>
            }
          />
              <Route path="/admin/clients" element={<AdminRoute><AdminClients /></AdminRoute>} />
              <Route path="/admin/feature-toggles" element={<AdminRoute><AdminFeatureToggles /></AdminRoute>} />
              <Route path="/admin/central-brain" element={<AdminRoute><AgencyCentralBrain /></AdminRoute>} />
              <Route
                path="/admin/reports"
                element={
                  <AdminRoute>
                    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading admin reports...</div>}>
                      <AdminReports />
                    </Suspense>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/calendar"
                element={
                  <AdminRoute>
                    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading calendar...</div>}>
                      <AdminCalendar />
                    </Suspense>
                  </AdminRoute>
                }
              />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/agent-runs" element={<AdminRoute><AdminAgentRuns /></AdminRoute>} />
              <Route path="/admin/agent-controller" element={<AdminRoute><AdminAgentController /></AdminRoute>} />
              <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
                </SidebarToggleProvider>
              </DocumentParsingProvider>
            </ProjectProvider>
          </UserProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
