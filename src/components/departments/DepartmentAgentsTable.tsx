import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Search } from "lucide-react";
import { DepartmentAgentRow } from "./types";

interface Props {
  rows: DepartmentAgentRow[];
}

function getStatusPillClasses(status: DepartmentAgentRow["status"]) {
  if (status === "online") return "text-emerald-500 bg-emerald-500/10";
  if (status === "busy") return "text-amber-500 bg-amber-500/10";
  return "text-muted-foreground bg-muted";
}

export const DepartmentAgentsTable = ({ rows }: Props) => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "online" | "busy" | "offline">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const statusOk = status === "all" ? true : r.status === status;
      const text =
        `${r.name} ${r.role} ${r.ongoingProjects.join(" ")}`.toLowerCase();
      const queryOk = q ? text.includes(q) : true;
      return statusOk && queryOk;
    });
  }, [rows, query, status]);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4">
        <h3 className="text-lg font-semibold text-foreground">Agents</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="w-64 pl-8"
              placeholder="Search agents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={(v: any) => setStatus(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status: All</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ongoing Projects</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    {r.avatarUrl ? <AvatarImage src={r.avatarUrl} alt={r.name} /> : null}
                    <AvatarFallback>{r.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-foreground">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.role}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusPillClasses(
                    r.status,
                  )}`}
                >
                  <span className="h-2 w-2 rounded-full bg-current"></span>
                  {r.status === "online"
                    ? "Online"
                    : r.status === "busy"
                    ? "Busy"
                    : "Offline"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {r.ongoingProjects.map((p, idx) => (
                    <Badge key={idx} variant="outline" className="border-primary/20 text-primary">
                      {p}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{r.lastActive}</TableCell>
              <TableCell className="text-right">
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                No agents found.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
};





