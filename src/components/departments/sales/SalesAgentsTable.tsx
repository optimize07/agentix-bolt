import { SalesAgentRow } from "@/components/departments/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Props {
  rows: SalesAgentRow[];
}

function getStatusStyles(status: SalesAgentRow["status"]) {
  if (status === "online") return "text-emerald-500 bg-emerald-500/10";
  if (status === "busy") return "text-amber-500 bg-amber-500/10";
  return "text-muted-foreground bg-muted";
}

export const SalesAgentsTable = ({ rows }: Props) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="text-lg font-semibold text-foreground">Agents</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sales Volume</TableHead>
            <TableHead>Close Rate</TableHead>
            <TableHead>Active Leads</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="hover:bg-muted/40">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    {r.avatarUrl ? <AvatarImage src={r.avatarUrl} alt={r.name} /> : null}
                    <AvatarFallback>{r.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">{r.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusStyles(r.status)}`}>
                  <span className="h-2 w-2 rounded-full bg-current"></span>
                  {r.status === "online" ? "Online" : r.status === "busy" ? "On a Call" : "Offline"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-28">
                    <Progress value={r.salesPercent} className="h-1.5" />
                  </div>
                  <span className="text-sm text-muted-foreground">{r.salesVolume}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{r.closeRate}</TableCell>
              <TableCell className="text-muted-foreground">{r.activeLeads}</TableCell>
              <TableCell className="text-right">
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                No agents found.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
};





