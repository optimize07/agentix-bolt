import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { MessageCircle, Send, Loader2, Settings2, Sparkles, Copy, RotateCcw, ArrowRight, Save, Trash2, Images, Wand2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { CanvasNodeData, CanvasBlock, ConnectedContext } from '@/types/canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BaseNode from './BaseNode';
import { useChatNodePersistence } from '@/hooks/useChatNodePersistence';
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sections?: ParsedSection[];
}

interface ParsedSection {
  id: string;
  type: 'headline' | 'copy' | 'cta' | 'text';
  label: string;
  content: string;
}

const AVAILABLE_MODELS = [
  { value: 'smart-auto', label: 'Smart Auto', description: 'AI picks best model' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini Flash', description: 'Fast & balanced' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini Pro', description: 'Most capable' },
  { value: 'openai/gpt-5', label: 'GPT-5', description: 'OpenAI flagship' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini', description: 'Fast & affordable' },
  { value: 'openrouter/anthropic/claude-sonnet-4', label: 'Claude Sonnet 4', description: 'Anthropic flagship' },
  { value: 'openrouter/anthropic/claude-3.5-haiku', label: 'Claude Haiku', description: 'Fast & efficient' },
];

/**
 * Build context from connected blocks for AI consumption
 */
function buildContextFromBlocks(connectedBlocks: CanvasBlock[]): { textContext: string; imageUrls: string[] } {
  const contextParts: string[] = [];
  const imageUrls: string[] = [];

  for (const block of connectedBlocks) {
    const label = block.title || block.type.toUpperCase();
    const instruction = block.instruction_prompt ? `\n[Use as: ${block.instruction_prompt}]` : '';

    switch (block.type) {
      case 'text':
        if (block.content) {
          contextParts.push(`[TEXT - ${label}]${instruction}\n${block.content}`);
        }
        break;
      case 'document':
        if (block.content) {
          contextParts.push(`[DOCUMENT: ${label}]${instruction}\n${block.content}`);
        }
        break;
      case 'url':
        if (block.content) {
          contextParts.push(`[URL: ${block.url || label}]${instruction}\n${block.content}`);
        }
        break;
      case 'image':
        const imgUrl = block.file_url || block.url;
        if (imgUrl) {
          imageUrls.push(imgUrl);
          contextParts.push(`[IMAGE: ${label}]${instruction}\n(Reference image provided for visual context)`);
        }
        break;
      case 'video':
        if (block.content) {
          contextParts.push(`[VIDEO: ${label}]${instruction}\n${block.content}`);
        }
        break;
      case 'brain':
        if (block.content) {
          contextParts.push(`[CENTRAL BRAIN: ${label}]${instruction}\n${block.content}`);
        }
        break;
      default:
        if (block.content) {
          contextParts.push(`[${block.type.toUpperCase()}: ${label}]${instruction}\n${block.content}`);
        }
    }
  }

  return {
    textContext: contextParts.join('\n\n---\n\n'),
    imageUrls,
  };
}

/**
 * Parse AI response into sections (Headlines, Copy, CTAs, etc.)
 */
function parseResponseSections(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  
  // Pattern for markdown headers like ## Headlines, ## Primary Text, ## CTA
  const sectionPattern = /##\s*(Headlines?|Primary Text|Body Copy|Copy|CTAs?|Call to Action|Description|Hook|Subheadline?)\s*\n([\s\S]*?)(?=##|$)/gi;
  
  let match;
  let foundSections = false;
  
  while ((match = sectionPattern.exec(content)) !== null) {
    foundSections = true;
    const sectionLabel = match[1].trim();
    const sectionContent = match[2].trim();
    
    if (!sectionContent) continue;

    // Determine section type
    let type: ParsedSection['type'] = 'text';
    const labelLower = sectionLabel.toLowerCase();
    if (labelLower.includes('headline') || labelLower.includes('hook')) {
      type = 'headline';
    } else if (labelLower.includes('cta') || labelLower.includes('call to action')) {
      type = 'cta';
    } else if (labelLower.includes('copy') || labelLower.includes('text') || labelLower.includes('body') || labelLower.includes('description')) {
      type = 'copy';
    }

    sections.push({
      id: crypto.randomUUID(),
      type,
      label: sectionLabel,
      content: sectionContent,
    });
  }

  // If no sections found, return the whole content as a single section
  if (!foundSections && content.trim()) {
    sections.push({
      id: crypto.randomUUID(),
      type: 'text',
      label: 'Response',
      content: content.trim(),
    });
  }

  return sections;
}

const ChatNode: React.FC<NodeProps> = ({ data, selected, id }) => {
  const nodeData = data as unknown as CanvasNodeData;
  const [localTitle, setLocalTitle] = useState(nodeData.title || 'AI Chat');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [selectedModel, setSelectedModel] = useState('smart-auto');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get board ID from nodeData metadata or context
  const boardId = (nodeData.metadata?.boardId as string) || '';

  // Use persistence hook for message management
  const {
    messages,
    isLoadingHistory,
    addMessage,
    clearMessages,
    setMessages,
  } = useChatNodePersistence({ blockId: id, boardId });

  const connectedBlocks = (nodeData.connectedBlocks || []) as CanvasBlock[];

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value);
    nodeData.onTitleChange?.(e.target.value);
  }, [nodeData]);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    // Add user message via persistence hook
    addMessage(userMessage);
    setInputValue('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      // Build context from connected blocks
      const context = buildContextFromBlocks(connectedBlocks);
      
      // Build system prompt with context
      let systemPrompt = 'You are a helpful AI assistant for creative advertising and marketing work. When generating ad copy, organize your response with clear sections using markdown headers like ## Headlines, ## Primary Text, ## CTA.';
      if (context.textContext) {
        systemPrompt += `\n\n=== CONNECTED CONTEXT ===\nThe following content is connected to this chat and should inform your responses:\n\n${context.textContext}\n\n=== END CONTEXT ===`;
      }

      // Build messages array with potential image support
      const userContent: any = userMessage.content;
      
      // If we have images in context, include them in the user message for multimodal models
      let messageContent: any = userContent;
      if (context.imageUrls.length > 0) {
        messageContent = [
          { type: 'text', text: userContent },
          ...context.imageUrls.slice(0, 3).map(url => ({
            type: 'image_url',
            image_url: { url }
          }))
        ];
      }

      // Prepare messages for AI
      const aiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: messageContent }
      ];

      // Stream the response
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: aiMessages,
          model: selectedModel,
        }),
      });

      // Handle rate limiting and payment errors
      if (response.status === 429) {
        toast.error('Rate limit exceeded. Please wait a moment and try again.');
        setIsLoading(false);
        return;
      }
      
      if (response.status === 402) {
        toast.error('AI credits exhausted. Please add funds to continue.');
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Process SSE lines
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                setStreamingContent(fullContent);
              }
            } catch {
              // Incomplete JSON, put it back and wait for more data
              buffer = line + '\n' + buffer;
              break;
            }
          }
        }
        
        // Final flush
        if (buffer.trim()) {
          for (let raw of buffer.split('\n')) {
            if (!raw) continue;
            if (raw.endsWith('\r')) raw = raw.slice(0, -1);
            if (raw.startsWith(':') || raw.trim() === '') continue;
            if (!raw.startsWith('data: ')) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                setStreamingContent(fullContent);
              }
            } catch { /* ignore partial */ }
          }
        }
      }

      // Parse sections from the response
      const sections = parseResponseSections(fullContent);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent || 'No response received.',
        timestamp: new Date(),
        sections: sections.length > 1 ? sections : undefined,
      };

      addMessage(assistantMessage);
      setStreamingContent('');
    } catch (err) {
      console.error('Chat error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to get AI response');
      
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      });
      setStreamingContent('');
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, connectedBlocks, selectedModel, addMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const copyContent = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  }, []);

  const regenerateMessage = useCallback((messageIndex: number) => {
    // Find the user message before this assistant message
    if (messageIndex > 0 && messages[messageIndex - 1]?.role === 'user') {
      const userContent = messages[messageIndex - 1].content;
      // Remove messages from this point (regenerate requires truncating history)
      setMessages(messages.slice(0, messageIndex - 1));
      setInputValue(userContent);
    }
  }, [messages, setMessages]);

  const handleClearChat = useCallback(() => {
    clearMessages();
    setStreamingContent('');
  }, [clearMessages]);

  const pushToCreative = useCallback((content: string, sectionType: string) => {
    if (nodeData.onPushToCreative) {
      nodeData.onPushToCreative(content, sectionType);
    } else {
      toast.info('Push to Creative not available');
    }
  }, [nodeData]);

  // Quick Batch Generator state
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchPrompt, setBatchPrompt] = useState('');
  const [batchCount, setBatchCount] = useState(3);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchImages, setBatchImages] = useState<string[]>([]);

  const generateBatchImages = useCallback(async () => {
    if (!batchPrompt.trim() || isBatchGenerating) return;

    setIsBatchGenerating(true);
    setBatchImages([]);

    try {
      // Get reference images from connected blocks
      const context = buildContextFromBlocks(connectedBlocks);
      
      toast.info(`Generating ${batchCount} image variations...`);

      const response = await supabase.functions.invoke('batch-generate-images', {
        body: {
          prompt: batchPrompt,
          referenceImageUrls: context.imageUrls,
          count: batchCount,
          maxReferencesPerImage: 10,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { images, errors } = response.data;
      
      if (images && images.length > 0) {
        setBatchImages(images);
        toast.success(`Generated ${images.length} images`);
        
        if (errors && errors.length > 0) {
          toast.warning(`${errors.length} image(s) failed to generate`);
        }
      } else {
        throw new Error('No images were generated');
      }
    } catch (err) {
      console.error('Batch generation error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to generate images');
    } finally {
      setIsBatchGenerating(false);
    }
  }, [batchPrompt, batchCount, connectedBlocks, isBatchGenerating]);

  return (
    <BaseNode
      selected={selected}
      onDelete={nodeData.onDelete}
      color="#22c55e"
      showTargetHandle={true}
      showSourceHandle={true}
      className="min-w-[380px]"
      headerContent={
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <MessageCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
          <Input
            value={localTitle}
            onChange={handleTitleChange}
            className="h-5 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 font-medium truncate nodrag"
            placeholder="Chat title..."
          />
          {connectedBlocks.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
              {connectedBlocks.length} sources
            </Badge>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0">
                <Settings2 className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">AI Model</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value} className="text-xs">
                          <div>
                            <div className="font-medium">{model.label}</div>
                            <div className="text-muted-foreground">{model.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={handleClearChat}
                >
                  <Trash2 className="h-3 w-3 mr-1.5" />
                  Clear Chat
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      }
    >
      <div className="space-y-2">
        {/* Connected context indicator */}
        {connectedBlocks.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>Context from {connectedBlocks.length} connected block(s)</span>
          </div>
        )}

        {/* Messages area */}
        <ScrollArea className="h-[220px] pr-2" ref={scrollRef}>
          <div className="space-y-3">
            {isLoadingHistory ? (
              <div className="space-y-3 p-2">
                <div className="flex justify-end">
                  <Skeleton className="h-8 w-32 rounded-lg" />
                </div>
                <div className="flex justify-start">
                  <Skeleton className="h-16 w-48 rounded-lg" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
              </div>
            ) : messages.length === 0 && !streamingContent ? (
              <div className="h-[200px] flex items-center justify-center text-center">
                <div>
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">
                    Connect content blocks and ask questions.
                    <br />
                    AI will use connected context.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, msgIndex) => (
                  <div key={msg.id} className="text-xs">
                    {msg.role === 'user' ? (
                      <div className="text-right">
                        <div className="inline-block max-w-[90%] p-2 rounded-lg bg-primary text-primary-foreground">
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-left space-y-2">
                        {/* Render sections if available */}
                        {msg.sections && msg.sections.length > 1 ? (
                          msg.sections.map((section) => (
                            <div key={section.id} className="group bg-muted rounded-lg overflow-hidden">
                              <div className="flex items-center justify-between px-2 py-1 bg-muted/80 border-b border-border/50">
                                <Badge 
                                  variant="outline" 
                                  className={`text-[9px] h-4 ${
                                    section.type === 'headline' ? 'border-amber-500 text-amber-600' :
                                    section.type === 'cta' ? 'border-green-500 text-green-600' :
                                    section.type === 'copy' ? 'border-blue-500 text-blue-600' :
                                    'border-muted-foreground'
                                  }`}
                                >
                                  {section.label}
                                </Badge>
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => copyContent(section.content)}
                                    title="Copy"
                                  >
                                    <Copy className="h-2.5 w-2.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => pushToCreative(section.content, section.label)}
                                    title="Push to Creative"
                                  >
                                    <ArrowRight className="h-2.5 w-2.5" />
                                  </Button>
                                </div>
                              </div>
                              <div className="p-2">
                                <p className="whitespace-pre-wrap">{section.content}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="group">
                            <div className="inline-block max-w-[90%] p-2 rounded-lg bg-muted">
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => copyContent(msg.content)}
                              >
                                <Copy className="h-2.5 w-2.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => regenerateMessage(msgIndex)}
                              >
                                <RotateCcw className="h-2.5 w-2.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => pushToCreative(msg.content, 'Response')}
                              >
                                <ArrowRight className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {/* Streaming content indicator */}
                {streamingContent && (
                  <div className="text-left text-xs">
                    <div className="inline-block max-w-[90%] p-2 rounded-lg bg-muted">
                      <p className="whitespace-pre-wrap">{streamingContent}</p>
                      <span className="inline-block w-1.5 h-3 bg-foreground/50 animate-pulse ml-0.5" />
                    </div>
                  </div>
                )}
              </>
            )}
            {isLoading && !streamingContent && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Connecting...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="flex gap-1.5">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about connected content..."
            className="text-xs h-8 flex-1"
            disabled={isLoading}
          />
          <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                title="Quick Batch Generator"
              >
                <Images className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                  Quick Batch Generator
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Image Prompt</label>
                  <Textarea
                    value={batchPrompt}
                    onChange={(e) => setBatchPrompt(e.target.value)}
                    placeholder="Describe the images you want to generate..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Number of Images</label>
                    <span className="text-sm text-muted-foreground">{batchCount}</span>
                  </div>
                  <Slider
                    value={[batchCount]}
                    onValueChange={([val]) => setBatchCount(val)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>
                {connectedBlocks.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>
                      Using {connectedBlocks.filter(b => b.type === 'image').length} reference images from connected blocks
                    </span>
                  </div>
                )}
                <Button
                  onClick={generateBatchImages}
                  disabled={!batchPrompt.trim() || isBatchGenerating}
                  className="w-full"
                >
                  {isBatchGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate {batchCount} Variations
                    </>
                  )}
                </Button>
                {batchImages.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Generated Images</label>
                    <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                      {batchImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={imgUrl}
                            alt={`Generated ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-white"
                              onClick={() => {
                                navigator.clipboard.writeText(imgUrl);
                                toast.success('Image URL copied');
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-white"
                              onClick={() => pushToCreative(imgUrl, 'Generated Image')}
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button
            size="sm"
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="h-8 px-2"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </BaseNode>
  );
};

export default ChatNode;
