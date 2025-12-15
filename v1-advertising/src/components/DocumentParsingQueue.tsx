import { useDocumentParsing } from '@/contexts/DocumentParsingContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DocumentParsingQueue = () => {
  const { processingJobs, completedCount } = useDocumentParsing();

  if (processingJobs.length === 0) return null;

  const totalCount = processingJobs.length;
  const activeCount = processingJobs.filter(j => j.status === 'queued' || j.status === 'parsing').length;

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Parsing Documents</span>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-64 overflow-auto">
        {processingJobs.map(job => (
          <div
            key={job.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-md transition-colors",
              job.status === 'complete' && "bg-secondary/50",
              job.status === 'failed' && "bg-destructive/10"
            )}
          >
            {job.status === 'queued' && (
              <Loader2 className="h-4 w-4 text-muted-foreground" />
            )}
            {job.status === 'parsing' && (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            )}
            {job.status === 'complete' && (
              <CheckCircle2 className="h-4 w-4 text-secondary" />
            )}
            {job.status === 'failed' && (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <span className="text-sm flex-1 truncate">{job.name}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {job.status === 'queued' ? 'Queued' : ''}
              {job.status === 'parsing' ? 'Parsing...' : ''}
              {job.status === 'complete' ? 'Done' : ''}
              {job.status === 'failed' ? 'Failed' : ''}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
