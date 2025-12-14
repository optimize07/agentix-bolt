import { useMemo, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, Loader2 } from "lucide-react";
import { listClients, type Client } from "@/integrations/clients/api";

/**
 * ClientSwitcher
 *
 * Allows an admin to quickly switch between clients from within any client page.
 * Now loads clients from the database instead of hardcoded array.
 *
 * Auth Note:
 * - In production this control should be restricted to users with admin privileges.
 * - Auth is not fully implemented yet, so this is intentionally always enabled.
 */
export function ClientSwitcher() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const data = await listClients();
      setClients(data);
    } catch (e) {
      console.error("Failed to load clients:", e);
      // Fallback to empty array - will show "Switch client" placeholder
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  const selectedValue = clientId ?? "all";

  const handleChange = (value: string) => {
    if (value === "all") {
      navigate("/admin");
      return;
    }
    navigate(`/client/${value}`);
  };

  const selectedClient = clients.find((c) => c.slug === selectedValue);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center">
            <Select value={selectedValue} onValueChange={handleChange} disabled={loading}>
              <SelectTrigger className="h-9 bg-background border-border text-sm inline-flex items-center gap-2 w-auto min-w-[200px]">
                <Building2 className="h-4 w-4 shrink-0" />
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : selectedClient ? (
                  <span className="inline-flex items-center gap-1.5 flex-1 text-left">
                    <span className="font-medium">{selectedClient.name}</span>
                    {selectedClient.type && (
                      <>
                        <span className="text-muted-foreground">—</span>
                        <span className="text-muted-foreground">{selectedClient.type}</span>
                      </>
                    )}
                  </span>
                ) : (
                  <SelectValue placeholder="Switch client" />
                )}
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Clients — Overview</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{c.name}</span>
                      {c.type && (
                        <span className="text-xs text-muted-foreground">{c.type}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Admin-only control; auth not enforced yet.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
