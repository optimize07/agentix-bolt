import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { StrategySidebar } from "@/components/StrategySidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, RefreshCcw, Database, FileText, Video, BookOpen, Settings } from "lucide-react";
import { AgentChatWindow } from "@/components/agents/AgentChatWindow";
import { AgentConfig, listAgentConfigs } from "@/integrations/n8n/agents";
import { N8nAgentConfigModal } from "@/components/agents/N8nAgentConfigModal";

const INDEXED_SOURCES = [
  { icon: FileText, label: "Product documentation", count: 42 },
  { icon: BookOpen, label: "Support articles", count: 128 },
  { icon: Database, label: "Knowledge base entries", count: 256 },
  { icon: Video, label: "Training video transcripts", count: 18 },
];

const StrategyCompanyBrain = () => {
  const { clientId } = useParams();
  const [ragAgent, setRagAgent] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    loadRagAgent();
  }, [clientId]);

  async function loadRagAgent() {
    setLoading(true);
    try {
      // Look for the RAG agent (predefined or configured)
      const configs = await listAgentConfigs({ area: "strategy", clientId, includePredefined: true });
      const rag = configs.find((c) => c.agent_key === "rag-agent" || c.agent_key === "company-brain");
      setRagAgent(rag || null);
    } catch (e) {
      console.error("Failed to load RAG agent:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <StrategySidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-background px-6 py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-7 w-7 text-primary" />
              <div>
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground">
                  Company Brain
                </h1>
                <p className="text-sm text-muted-foreground">
                  Query your unified knowledge base with AI-powered search
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setConfigOpen(true)}>
                <Settings className="h-4 w-4" />
                Configure
              </Button>
              <Button className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Reindex Sources
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex gap-6 p-6 lg:p-8">
          {/* Chat Area */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <Card className="h-full flex items-center justify-center border border-border bg-card">
                <div className="text-center">
                  <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Loading agent...</p>
                </div>
              </Card>
            ) : ragAgent ? (
              <AgentChatWindow agent={ragAgent} clientId={clientId} className="h-full" />
            ) : (
              <Card className="h-full flex items-center justify-center border border-border bg-card">
                <div className="text-center max-w-md p-8">
                  <BrainCircuit className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg text-foreground mb-2">RAG Agent Not Configured</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The Company Brain requires a RAG agent to be configured. This agent connects to your 
                    vectorized knowledge base to answer questions about your company's SOPs, documentation, 
                    and training materials.
                  </p>
                  <Button onClick={() => setConfigOpen(true)}>Configure RAG Agent</Button>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar - Indexed Sources */}
          <div className="w-80 flex-shrink-0 hidden xl:block">
            <Card className="h-full border border-border bg-card p-6 overflow-auto">
              <h3 className="text-lg font-bold text-foreground mb-4">Indexed Sources</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your Company Brain has access to the following knowledge sources:
              </p>
              
              <div className="space-y-4">
                {INDEXED_SOURCES.map((source) => {
                  const Icon = source.icon;
                  return (
                    <div key={source.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{source.label}</p>
                        <p className="text-xs text-muted-foreground">{source.count} documents</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-medium text-foreground mb-2">Tips</h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li>• Ask specific questions for better results</li>
                  <li>• Reference document names when known</li>
                  <li>• Use "what is our SOP for..." format</li>
                  <li>• Ask follow-up questions to drill down</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>

        {/* Configuration Modal */}
        <N8nAgentConfigModal
          open={configOpen}
          onOpenChange={setConfigOpen}
          scope="agency"
          area="strategy"
          agentKey="rag-agent"
          initialConfig={ragAgent}
          title="Configure RAG Agent"
          onSaved={loadRagAgent}
        />
      </main>
    </div>
  );
};

export default StrategyCompanyBrain;
