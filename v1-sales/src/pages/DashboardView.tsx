import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutDashboard, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dashboard } from "@/types/dataBinding";
import { useToast } from "@/hooks/use-toast";

interface DashboardViewProps {
  dashboards: Dashboard[];
  onCreateDashboard: () => void;
  onEditDashboard: (id: string) => void;
  onDeleteDashboard: (id: string) => void;
  onViewDashboard: (id: string) => void;
}

const DashboardView = ({
  dashboards,
  onCreateDashboard,
  onEditDashboard,
  onDeleteDashboard,
  onViewDashboard,
}: DashboardViewProps) => {
  const { toast } = useToast();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete dashboard "${name}"?`)) {
      onDeleteDashboard(id);
      toast({
        title: "Dashboard Deleted",
        description: `${name} has been removed`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboards</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create and manage custom dashboards with data from your sheets
            </p>
          </div>
          <Button onClick={onCreateDashboard}>
            <Plus size={16} className="mr-2" />
            New Dashboard
          </Button>
        </div>
      </div>

      <div className="p-6">
        {dashboards.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <LayoutDashboard size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No dashboards yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first dashboard to visualize data from your sheets
              </p>
              <Button onClick={onCreateDashboard}>
                <Plus size={16} className="mr-2" />
                Create Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboards.map((dashboard) => (
              <Card
                key={dashboard.id}
                className="hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => onViewDashboard(dashboard.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                      {dashboard.description && (
                        <CardDescription className="mt-1">
                          {dashboard.description}
                        </CardDescription>
                      )}
                    </div>
                    <LayoutDashboard size={20} className="text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {dashboard.components.length} component{dashboard.components.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditDashboard(dashboard.id);
                        }}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(dashboard.id, dashboard.name);
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
