import React, { useState, useCallback } from 'react';
import { NodeProps } from '@xyflow/react';
import { FileText, Upload, Loader2, CheckCircle, XCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { CanvasNodeData, ParsingStatus } from '@/types/canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BaseNode from './BaseNode';

const statusConfig: Record<ParsingStatus, { icon: React.ReactNode; label: string; color: string }> = {
  none: { icon: null, label: 'Not parsed', color: 'secondary' },
  pending: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: 'Pending', color: 'secondary' },
  processing: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: 'Processing', color: 'default' },
  completed: { icon: <CheckCircle className="h-3 w-3" />, label: 'Parsed', color: 'default' },
  failed: { icon: <XCircle className="h-3 w-3" />, label: 'Failed', color: 'destructive' },
};

const DocumentNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CanvasNodeData;
  const [localTitle, setLocalTitle] = useState(nodeData.title || 'Document');
  const [content, setContent] = useState(nodeData.content || '');
  const [parsingStatus, setParsingStatus] = useState<ParsingStatus>(nodeData.parsingStatus || 'none');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(nodeData.filePath || '');
  const [instructionPrompt, setInstructionPrompt] = useState(nodeData.instructionPrompt || '');

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value);
    nodeData.onTitleChange?.(e.target.value);
  }, [nodeData]);

  const handleInstructionChange = useCallback((value: string) => {
    setInstructionPrompt(value);
    nodeData.onInstructionChange?.(value);
  }, [nodeData]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const parseDocument = useCallback(async (file: File) => {
    setParsingStatus('processing');
    setFileName(file.name);
    
    try {
      // Upload to storage first
      const fileExt = file.name.split('.').pop();
      const filePath = `documents/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('canvas-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('canvas-files')
        .getPublicUrl(filePath);

      // Parse the document
      const { data: result, error } = await supabase.functions.invoke('parse-document', {
        body: { fileUrl: urlData.publicUrl, fileName: file.name }
      });

      if (error) throw error;

      const parsed = result?.content || result?.text || '';
      setContent(parsed);
      setParsingStatus('completed');
      nodeData.onContentChange?.(parsed);
      
      if (!localTitle || localTitle === 'Document') {
        setLocalTitle(file.name);
        nodeData.onTitleChange?.(file.name);
      }
      
      toast.success('Document parsed successfully');
    } catch (err) {
      console.error('Parse error:', err);
      setParsingStatus('failed');
      toast.error('Failed to parse document');
    }
  }, [localTitle, nodeData]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (validTypes.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        parseDocument(file);
      } else {
        toast.error('Please upload a PDF or Word document');
      }
    }
  }, [parseDocument]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      parseDocument(files[0]);
    }
  }, [parseDocument]);

  const status = statusConfig[parsingStatus];

  return (
    <BaseNode
      selected={selected}
      onDelete={nodeData.onDelete}
      color={nodeData.color}
      headerContent={
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <FileText className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
          <Input
            value={localTitle}
            onChange={handleTitleChange}
            className="h-5 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 font-medium truncate"
            placeholder="Document title..."
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-5 w-5 flex-shrink-0 ${instructionPrompt ? 'text-amber-500' : 'text-muted-foreground'}`}
              >
                <MessageSquare className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start">
              <div className="space-y-2">
                <label className="text-xs font-medium">AI Instructions</label>
                <Textarea
                  value={instructionPrompt}
                  onChange={(e) => handleInstructionChange(e.target.value)}
                  placeholder="e.g., Extract key points, summarize main arguments..."
                  className="text-xs min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Tell the AI how to use this document content.
                </p>
              </div>
            </PopoverContent>
          </Popover>
          {parsingStatus !== 'none' && (
            <Badge variant={status.color as any} className="text-[10px] h-4 px-1 gap-0.5">
              {status.icon}
              {status.label}
            </Badge>
          )}
        </div>
      }
    >
      <div className="space-y-2">
        {content ? (
          <>
            <ScrollArea className="h-[120px] rounded-md border bg-muted/30 p-2">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {content.slice(0, 1500)}
                {content.length > 1500 && '...'}
              </p>
            </ScrollArea>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {fileName}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setContent('');
                  setParsingStatus('none');
                  setFileName('');
                }}
                className="h-6 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Replace
              </Button>
            </div>
          </>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/30'
            }`}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-2">
              Drag & drop a PDF or Word document
            </p>
            <label className="cursor-pointer">
              <Button size="sm" variant="secondary" className="text-xs" asChild>
                <span>Browse Files</span>
              </Button>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
    </BaseNode>
  );
};

export default DocumentNode;
