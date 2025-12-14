import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DepartmentHeaderProps {
  title: string;
  subtitle?: string;
  onAddAgent?: () => void;
}

export const DepartmentHeader = ({ title, subtitle, onAddAgent }: DepartmentHeaderProps) => {
  const { clientId } = useParams();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Link className="hover:text-foreground" to={`/client/${clientId}`}>
            Dashboard
          </Link>
          <span>/</span>
          <Link className="hover:text-foreground" to={`/client/${clientId}`}>
            Departments
          </Link>
          <span>/</span>
          <span className="text-foreground">{title.replace(" Department", "")}</span>
        </div>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">{title}</h1>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      <Button onClick={onAddAgent} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
        <Plus className="h-4 w-4" />
        Add Agent
      </Button>
    </div>
  );
};


