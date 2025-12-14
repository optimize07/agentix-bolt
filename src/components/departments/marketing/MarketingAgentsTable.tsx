import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Mail, RotateCw, Bot } from "lucide-react";

export type MarketingAgentRow = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  status: "active" | "on-leave";
  contentProgressPercent: number; // 0-100
  contentText: string; // "15/20 Projects"
  campaignsProgressPercent: number; // 0-100
  campaignsText: string; // "6/10 Campaigns"
  healthPercent: number; // 0-100
  isAI?: boolean;
  email?: string;
  description?: string;
};

function StatusPill({ status }: { status: MarketingAgentRow["status"] }) {
  const isActive = status === "active";
  const classes = isActive
    ? "text-emerald-500 bg-emerald-500/10"
    : "text-muted-foreground bg-muted";
  const dot = isActive ? "bg-emerald-500" : "bg-foreground/50";
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {isActive ? "Active" : "On Leave"}
    </div>
  );
}

function CircularProgress({ percent }: { percent: number }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const dash = `${(clamped / 100) * circumference} ${circumference}`;
  const strokeColor =
    clamped >= 90 ? "stroke-emerald-500" : clamped >= 70 ? "stroke-amber-500" : "stroke-red-500";

  return (
    <div className="relative h-12 w-12">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 40 40">
        <circle
          className="stroke-muted"
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          strokeWidth="3"
        />
        <circle
          className={strokeColor}
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          strokeLinecap="round"
          strokeWidth="3"
          strokeDasharray={dash}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-xs font-bold text-foreground">{clamped}%</span>
      </div>
    </div>
  );
}

interface Props {
  rows: MarketingAgentRow[];
  onRun?: (row: MarketingAgentRow) => void;
  onEdit?: (row: MarketingAgentRow) => void;
  onView?: (row: MarketingAgentRow) => void;
  onMessage?: (row: MarketingAgentRow) => void;
  onRowClick?: (row: MarketingAgentRow) => void;
}

export const MarketingAgentsTable = ({ rows, onRun, onEdit, onView, onMessage, onRowClick }: Props) => {
  const data = useMemo(() => rows, [rows]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Content Creation</TableHead>
              <TableHead>Campaigns</TableHead>
              <TableHead className="text-center">Health Pulse</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r) => (
              <TableRow 
                key={r.id}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onRowClick?.(r)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {r.avatarUrl || r.isAI ? (
                        <AvatarImage src={r.avatarUrl || "/n8n.svg"} alt={r.name} />
                      ) : null}
                      <AvatarFallback className="text-xs font-medium text-foreground">
                        {r.isAI ? <Bot className="h-4 w-4" /> : r.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.role}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusPill status={r.status} />
                </TableCell>
                <TableCell>
                  <div className="w-56">
                    <Progress value={r.contentProgressPercent} className="h-2.5" />
                    <p className="mt-1 text-xs text-muted-foreground">{r.contentText}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-56">
                    <Progress value={r.campaignsProgressPercent} className="h-2.5" />
                    <p className="mt-1 text-xs text-muted-foreground">{r.campaignsText}</p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    <CircularProgress percent={r.healthPercent} />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onRun ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Run now" onClick={() => onRun(r)}>
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => onEdit?.(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="View"
                      disabled={!onView}
                      onClick={() => onView?.(r)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Send message"
                      disabled={!onMessage}
                      onClick={() => onMessage?.(r)}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};


