import { useParams } from "react-router-dom";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Shield } from "lucide-react";
import { ClientSwitcher } from "@/components/ClientSwitcher";

const SystemControl = () => {
  const { clientId } = useParams();

  return (
    <div className="flex h-screen w-full bg-background">
      <ChatSidebar />
      <main className="flex-1 overflow-auto">
        <div className="border-b border-border bg-background">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold text-foreground">System Control</h1>
              <span className="text-sm text-muted-foreground">for</span>
              <ClientSwitcher />
            </div>
          </div>
        </div>

        <div className="p-10">
          <div className="text-sm text-muted-foreground">
            Administrative system controls will appear here.
          </div>
        </div>
      </main>
    </div>
  );
};

export default SystemControl;


