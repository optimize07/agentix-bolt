import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BatchFileStatus {
  id: string;
  name: string;
  status: "pending" | "parsing" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

interface BatchUploadProgressProps {
  files: BatchFileStatus[];
  isOpen: boolean;
}

export function BatchUploadProgress({ files, isOpen }: BatchUploadProgressProps) {
  if (!isOpen || files.length === 0) return null;

  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === "success").length;
  const failedFiles = files.filter(f => f.status === "error").length;
  const overallProgress = (completedFiles / totalFiles) * 100;

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[500px] shadow-lg border-border z-50 backdrop-blur-sm bg-card/95">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Batch Upload Progress</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedFiles}/{totalFiles}
          </span>
        </CardTitle>
        <Progress value={overallProgress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-2 max-h-[380px] overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background/50",
              file.status === "success" && "border-primary/30 bg-primary/5",
              file.status === "error" && "border-destructive/30 bg-destructive/5"
            )}
          >
            {file.status === "pending" && (
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
            {(file.status === "parsing" || file.status === "uploading") && (
              <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
            )}
            {file.status === "success" && (
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            )}
            {file.status === "error" && (
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {file.status === "pending" && "Waiting..."}
                {file.status === "parsing" && "Extracting text..."}
                {file.status === "uploading" && "Uploading..."}
                {file.status === "success" && "Complete"}
                {file.status === "error" && (file.error || "Failed")}
              </p>
              {(file.status === "parsing" || file.status === "uploading") && (
                <Progress value={file.progress} className="h-1 mt-1" />
              )}
            </div>
          </div>
        ))}
        
        {failedFiles > 0 && (
          <p className="text-xs text-destructive text-center pt-2">
            {failedFiles} file{failedFiles !== 1 ? "s" : ""} failed to upload
          </p>
        )}
      </CardContent>
    </Card>
  );
}
