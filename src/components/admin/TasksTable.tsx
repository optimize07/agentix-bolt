import { Search, Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const tasks = [
  {
    name: "Market Research Report",
    client: "TechStart Solutions",
    department: "Strategy",
    priority: "High",
    status: "In Progress",
    assignedTo: "Sarah Johnson",
    date: "2024-01-15",
  },
  {
    name: "Campaign Creative Assets",
    client: "SMARTAX Corp",
    department: "Marketing",
    priority: "Medium",
    status: "Completed",
    assignedTo: "Mike Chen",
    date: "2024-01-14",
  },
  {
    name: "Client Proposal Development",
    client: "HealthHub",
    department: "Sales",
    priority: "High",
    status: "Pending",
    assignedTo: "John Wilson",
    date: "2024-01-16",
  },
  {
    name: "Website Integration",
    client: "ImagineSpace Ltd",
    department: "Strategy",
    priority: "Medium",
    status: "Waiting",
    assignedTo: "Emma Davis",
    date: "2024-01-13",
  },
  {
    name: "Social Media Content",
    client: "Global All-In-Consulting",
    department: "Marketing",
    priority: "Low",
    status: "In Progress",
    assignedTo: "Alex Rivera",
    date: "2024-01-17",
  },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "Medium":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "Low":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "In Progress":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "Pending":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "Waiting":
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const TasksTable = () => {
  return (
    <div 
      className="rounded-lg"
      style={{
        background: 'var(--card-bg)',
        border: 'var(--card-border-width) solid var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <Tabs defaultValue="all">
            <TabsList className="bg-sidebar">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="todo">To Do</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3 w-3" />
            New Task
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-10 bg-sidebar border-border"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-sidebar/50">
              <TableHead className="text-muted-foreground">Task Name</TableHead>
              <TableHead className="text-muted-foreground">Client</TableHead>
              <TableHead className="text-muted-foreground">Department</TableHead>
              <TableHead className="text-muted-foreground">Priority</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Assigned To</TableHead>
              <TableHead className="text-muted-foreground">Set Date</TableHead>
              <TableHead className="text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task, index) => (
              <TableRow key={index} className="border-border hover:bg-sidebar/50">
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs text-primary font-semibold">
                        {task.name.charAt(0)}
                      </span>
                    </div>
                    {task.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{task.client}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    {task.department}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{task.assignedTo}</TableCell>
                <TableCell className="text-muted-foreground">{task.date}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
