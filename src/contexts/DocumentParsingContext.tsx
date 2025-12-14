import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { untypedSupabase as supabase } from '@/integrations/supabase/untyped-client';
import { toast } from 'sonner';

interface ParsingJob {
  id: string;
  name: string;
  status: 'queued' | 'parsing' | 'complete' | 'failed';
  recordId: string;
  table: 'swipe_files' | 'canvas_blocks' | 'knowledge_entries';
  file: File;
  retryCount?: number;
}

interface DocumentParsingContextType {
  addToQueue: (file: File, recordId: string, table: 'swipe_files' | 'canvas_blocks' | 'knowledge_entries', name: string) => void;
  processingJobs: ParsingJob[];
  completedCount: number;
  isProcessing: boolean;
}

const DocumentParsingContext = createContext<DocumentParsingContextType | undefined>(undefined);

export const useDocumentParsing = () => {
  const context = useContext(DocumentParsingContext);
  if (!context) {
    throw new Error('useDocumentParsing must be used within DocumentParsingProvider');
  }
  return context;
};

export const DocumentParsingProvider = ({ children }: { children: ReactNode }) => {
  const [queue, setQueue] = useState<ParsingJob[]>([]);
  const [processingJobs, setProcessingJobs] = useState<ParsingJob[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const addToQueue = (file: File, recordId: string, table: 'swipe_files' | 'canvas_blocks' | 'knowledge_entries', name: string) => {
    const job: ParsingJob = {
      id: `${recordId}-${Date.now()}`,
      name,
      status: 'queued',
      recordId,
      table,
      file,
      retryCount: 0,
    };
    
    setQueue(prev => [...prev, job]);
    setProcessingJobs(prev => [...prev, job]);
  };

  const processQueue = async () => {
    if (isProcessing || queue.length === 0) return;
    
    setIsProcessing(true);
    const jobsToProcess = [...queue];
    setQueue([]);

    for (const job of jobsToProcess) {
      try {
        // Update job status to parsing
        setProcessingJobs(prev => 
          prev.map(j => j.id === job.id ? { ...j, status: 'parsing' } : j)
        );

        // Update database to processing
        await supabase
          .from(job.table)
          .update({ parsing_status: 'processing' })
          .eq('id', job.recordId);

        // Parse document
        const formData = new FormData();
        formData.append('file', job.file);
        
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-document`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to parse document');
        }

        const result = await response.json();

        // Update database with extracted content
        // Use correct column name based on table
        const contentColumn = job.table === 'canvas_blocks' ? 'content' : 'text_content';
        
        await supabase
          .from(job.table)
          .update({
            [contentColumn]: result.content,
            parsing_status: 'completed',
          })
          .eq('id', job.recordId);

        // Mark as complete
        setProcessingJobs(prev => 
          prev.map(j => j.id === job.id ? { ...j, status: 'complete' } : j)
        );
        setCompletedCount(prev => prev + 1);
        
        toast.success(`"${job.name}" parsed successfully`);

        // Remove from display after 2 seconds
        setTimeout(() => {
          setProcessingJobs(prev => prev.filter(j => j.id !== job.id));
        }, 2000);

      } catch (error) {
        console.error('Error parsing document:', error);

        // Update database to failed
        await supabase
          .from(job.table)
          .update({ parsing_status: 'failed' })
          .eq('id', job.recordId);

        // Mark as failed
        setProcessingJobs(prev => 
          prev.map(j => j.id === job.id ? { ...j, status: 'failed' } : j)
        );
        
        toast.error(`Failed to parse "${job.name}"`);

        // Remove from display after 3 seconds
        setTimeout(() => {
          setProcessingJobs(prev => prev.filter(j => j.id !== job.id));
        }, 3000);
      }
    }

    setIsProcessing(false);
  };

  useEffect(() => {
    if (queue.length > 0 && !isProcessing) {
      processQueue();
    }
  }, [queue.length, isProcessing]);

  return (
    <DocumentParsingContext.Provider
      value={{
        addToQueue,
        processingJobs,
        completedCount,
        isProcessing,
      }}
    >
      {children}
    </DocumentParsingContext.Provider>
  );
};



