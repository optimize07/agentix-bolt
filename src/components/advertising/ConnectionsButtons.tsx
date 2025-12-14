import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { N8nConnectForm } from "@/components/integrations/N8nConnectForm";
import { listN8nConnections } from "@/integrations/n8n/api";

type Toolkit = 'metaads' | 'googledrive' | 'googlesheets';

async function getConnection(toolkit: Toolkit, clientId?: string) {
  // Use supabase-js so the Edge Function receives the proper headers/session (if any).
  // Add a timestamp query param to bust any potential caching
  const { data, error } = await supabase.functions.invoke(
    `composio-manage-connection?t=${Date.now()}`,
    { body: { toolkit, clientId } }
  );
  if (error) throw error;
  return data as { status?: string; redirect_url?: string };
}

export function ConnectionsButtons() {
  const { clientId } = useParams();
  const [meta, setMeta] = useState<{ status?: string; redirect_url?: string }>({});
  const [drive, setDrive] = useState<{ status?: string; redirect_url?: string }>({});
  const [sheets, setSheets] = useState<{ status?: string; redirect_url?: string }>({});
  const [n8nCount, setN8nCount] = useState<number>(0);
  const [n8nOpen, setN8nOpen] = useState(false);

  useEffect(() => {
    getConnection('metaads', clientId).then(setMeta).catch(() => setMeta({ status: 'error' }));
    getConnection('googledrive', clientId).then(setDrive).catch(() => setDrive({ status: 'error' }));
    getConnection('googlesheets', clientId).then(setSheets).catch(() => setSheets({ status: 'error' }));
    (async () => {
      try {
        const agency = await listN8nConnections({ scope: "agency" });
        const client = await listN8nConnections({ scope: "client", clientId });
        const total = (agency?.connections?.length || 0) + (client?.connections?.length || 0);
        setN8nCount(total);
      } catch {
        setN8nCount(0);
      }
    })();
  }, [clientId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connections</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <ConnectionItem label="Meta Ads" data={meta} />
        <ConnectionItem label="Google Drive" data={drive} />
        <ConnectionItem label="Google Sheets" data={sheets} />
        <div className="border border-border rounded-lg p-4">
          <div className="mb-2 font-semibold flex items-center gap-2">
            <img src="/n8n.svg" className="h-4 w-7" alt="n8n" />
            n8n
          </div>
          <div className="mb-3 text-sm text-muted-foreground">
            {n8nCount > 0 ? `${n8nCount} connection${n8nCount > 1 ? 's' : ''}` : 'No connections'}
          </div>
          <Button variant="default" onClick={() => setN8nOpen(true)}>
            Manage
          </Button>
        </div>
      </CardContent>

      {/* Inline N8n configuration card (agency scope) so inherited connections are visible */}
      <div className="p-4">
        <N8nConnectForm scope="agency" onConnected={() => {
          setN8nOpen(false);
        }} />
      </div>
    </Card>
  );
}

function ConnectionItem({ label, data }: { label: string; data: any }) {
  const connected = data?.status === 'connected' || data?.status === 'active';
  const hasError = data?.status === 'error';

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="mb-2 font-semibold">{label}</div>
      <div className="mb-3 text-sm text-muted-foreground">
        {connected ? 'Connected' : hasError ? 'Connection error' : 'Not connected'}
      </div>
      {data?.redirect_url ? (
        <a href={data.redirect_url} target="_blank" rel="noopener noreferrer">
          <Button variant={connected ? "outline" : "default"}>
            {connected ? 'Reconnect' : 'Connect'}
          </Button>
        </a>
      ) : (
        <Button disabled variant="outline" title="Please configure Composio in environment variables">
          {hasError ? 'Configuration needed' : 'Configure server'}
        </Button>
      )}
    </div>
  );
}
