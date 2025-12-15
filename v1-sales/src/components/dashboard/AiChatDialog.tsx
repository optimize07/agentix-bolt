import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sparkles, Send, Trash2, Database, BookOpen, Boxes, Loader2, Check, X, Upload, Plus, Image as ImageIcon, ChevronDown, Info } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { AiChatMessage } from "./AiChatMessage";
import { streamChat } from "@/utils/streamChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ConversationHistory } from "./ConversationHistory";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  createConversation,
  addMessage,
  useConversation,
  useAiConversations,
  getConversationData,
  updateConversationData,
} from "@/hooks/useAiConversations";
import { supabase } from "@/integrations/supabase/client";
import { imageToBase64, validateImageFile } from "@/utils/imageToBase64";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { analyzeWidgetSuggestions, WidgetFeedback, getWidgetBadge } from "@/utils/widgetAnalyzer";

// Column type detection utility
type ColumnType = 'number' | 'currency' | 'percentage' | 'date' | 'text';

const detectColumnType = (values: any[]): ColumnType => {
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '').slice(0, 50); // Sample first 50
  if (nonEmptyValues.length === 0) return 'text';

  let numberCount = 0;
  let currencyCount = 0;
  let percentageCount = 0;
  let dateCount = 0;

  for (const val of nonEmptyValues) {
    const str = String(val).trim();
    
    // Check currency (starts with $, €, £, etc.)
    if (/^[$€£¥]\s*[\d,]+\.?\d*$/.test(str) || /^[\d,]+\.?\d*\s*[$€£¥]$/.test(str)) {
      currencyCount++;
      continue;
    }
    
    // Check percentage
    if (/^\d+\.?\d*\s*%$/.test(str)) {
      percentageCount++;
      continue;
    }
    
    // Check number
    if (!isNaN(Number(str.replace(/,/g, ''))) && str.replace(/,/g, '').length > 0) {
      numberCount++;
      continue;
    }
    
    // Check date (various formats)
    const datePatterns = [
      /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/,  // MM/DD/YYYY or DD-MM-YYYY
      /^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/,     // YYYY-MM-DD
      /^[A-Za-z]{3}\s+\d{1,2},?\s+\d{4}$/, // Jan 1, 2024
    ];
    if (datePatterns.some(pattern => pattern.test(str))) {
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) {
        dateCount++;
        continue;
      }
    }
  }

  const total = nonEmptyValues.length;
  const threshold = 0.7; // 70% of values should match

  if (currencyCount / total >= threshold) return 'currency';
  if (percentageCount / total >= threshold) return 'percentage';
  if (dateCount / total >= threshold) return 'date';
  if (numberCount / total >= threshold) return 'number';
  
  return 'text';
};

const formatCellValue = (value: any, type: ColumnType): string => {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value).trim();
  
  switch (type) {
    case 'number':
      const num = Number(str.replace(/,/g, ''));
      return isNaN(num) ? str : num.toLocaleString();
      
    case 'currency':
      // Extract number from currency string
      const currencyMatch = str.match(/[\d,]+\.?\d*/);
      if (currencyMatch) {
        const amount = Number(currencyMatch[0].replace(/,/g, ''));
        return isNaN(amount) ? str : `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return str;
      
    case 'percentage':
      const percentMatch = str.match(/\d+\.?\d*/);
      if (percentMatch) {
        return `${percentMatch[0]}%`;
      }
      return str;
      
    case 'date':
      try {
        const date = new Date(str);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      } catch {}
      return str;
      
    default:
      return str;
  }
};

const getTypeIcon = (type: ColumnType): string => {
  switch (type) {
    case 'number': return '123';
    case 'currency': return '$';
    case 'percentage': return '%';
    case 'date': return '📅';
    default: return 'T';
  }
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface WidgetSuggestion {
  widgetType: string;
  title: string;
  description: string;
  formula?: any;
  dataBinding?: any;
}

interface AiChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetData?: any[][];
  glossaryTerms?: any[];
  existingWidgets?: any[];
  onAcceptWidget?: (suggestion: WidgetSuggestion, sheetData?: any[][]) => void;
}

export const AiChatDialog = ({
  open,
  onOpenChange,
  sheetData,
  glossaryTerms = [],
  existingWidgets = [],
  onAcceptWidget,
}: AiChatDialogProps) => {
  const { user, organization } = useOrganization();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const { messages: loadedMessages, loading: messagesLoading } = useConversation(currentConversationId);
  const { refetch: refetchConversations } = useAiConversations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestedWidgets, setSuggestedWidgets] = useState<WidgetSuggestion[]>([]);
  const [widgetFeedback, setWidgetFeedback] = useState<Map<number, WidgetFeedback[]>>(new Map());
  const [uploadedSheet, setUploadedSheet] = useState<{ name: string; data: any[][] } | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{ name: string; data: any[][]; preview: string } | null>(null);
  const [isExtractingImage, setIsExtractingImage] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef<string>("");

  // Load messages from selected conversation
  useEffect(() => {
    if (loadedMessages.length > 0) {
      const formattedMessages: Message[] = loadedMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      setMessages(formattedMessages);

      // Restore widget suggestions from tool calls
      const allSuggestions: WidgetSuggestion[] = [];
      loadedMessages.forEach(msg => {
        if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
          msg.tool_calls.forEach((call: any) => {
            if (call.name === "generate_widgets" && call.arguments) {
              const widgets = call.arguments.widgets || [call.arguments];
              allSuggestions.push(...widgets);
            }
          });
        }
      });
      setSuggestedWidgets(allSuggestions);
    }
  }, [loadedMessages]);

  // Restore sheet data when switching conversations
  useEffect(() => {
    if (currentConversationId) {
      getConversationData(currentConversationId).then(metadata => {
        if (metadata && typeof metadata === 'object' && 'sheetData' in metadata) {
          const typedMetadata = metadata as { sheetData?: any[][], sheetName?: string };
          if (typedMetadata.sheetData) {
            setUploadedSheet({ 
              name: typedMetadata.sheetName || 'Restored Data', 
              data: typedMetadata.sheetData 
            });
          } else {
            setUploadedSheet(null);
          }
        } else {
          setUploadedSheet(null);
        }
      });
    } else {
      setUploadedSheet(null);
    }
  }, [currentConversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const quickActions = [
    { label: "Suggest widgets for my data", icon: Boxes },
    { label: "Explain my sheet columns", icon: Database },
    { label: "What widgets can I create?", icon: Sparkles },
    { label: "Help me visualize trends", icon: BookOpen },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').map(row => 
        row.split(',').map(cell => cell.trim())
      ).filter(row => row.some(cell => cell)); // Remove empty rows
      
      setUploadedSheet({ name: file.name, data: rows });
      setShowDataPreview(true); // Auto-expand preview on upload
      
      // Persist to conversation if one exists
      if (currentConversationId) {
        await updateConversationData(currentConversationId, rows, file.name);
      }
      toast.success('CSV file uploaded successfully');
    };
    reader.readAsText(file);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsExtractingImage(true);
    toast.loading("Extracting table from image...", { id: "image-extract" });

    try {
      const { base64, mimeType } = await imageToBase64(file);
      const preview = URL.createObjectURL(file);

      const { data, error } = await supabase.functions.invoke('extract-table-from-image', {
        body: { imageBase64: base64, imageMimeType: mimeType }
      });

      if (error) throw error;

      if (!data.success) {
        toast.error(data.error || "Could not detect a table in the image", { id: "image-extract" });
        setIsExtractingImage(false);
        return;
      }

      const extractedData = [data.headers, ...data.rows];
      setUploadedImage({ 
        name: file.name, 
        data: extractedData,
        preview 
      });
      setShowDataPreview(true); // Auto-expand preview on upload

      const confidenceEmoji = data.confidence === "high" ? "✅" : data.confidence === "medium" ? "⚠️" : "❌";
      toast.success(
        `Extracted ${data.rows.length} rows with ${data.confidence} confidence ${confidenceEmoji}`,
        { id: "image-extract" }
      );

      if (data.notes) {
        toast.info(data.notes, { duration: 5000 });
      }
    } catch (error) {
      console.error("Image extraction error:", error);
      toast.error("Failed to extract table from image", { id: "image-extract" });
    } finally {
      setIsExtractingImage(false);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isStreaming) return;

    console.log("[AI Chat] Sending message:", textToSend);
    const userMessage: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);
    setStreamError(null);
    setSuggestedWidgets([]);
    streamingMessageRef.current = "";
    let hasReceivedContent = false;
    let currentToolCalls: any[] = [];

    // Add placeholder for assistant response
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    // Auto-create conversation on first message
    let conversationId = currentConversationId;
    if (!conversationId && user?.id && organization?.id) {
      const title = textToSend.substring(0, 50) + (textToSend.length > 50 ? "..." : "");
      const metadata = {
        hasSheetData: !!(uploadedSheet?.data || sheetData),
        sheetName: uploadedSheet?.name,
        sheetData: uploadedSheet?.data, // Store actual data
      };
      conversationId = await createConversation(user.id, organization.id, title, metadata);
      if (conversationId) {
        setCurrentConversationId(conversationId);
        console.log("[AI Chat] Created new conversation:", conversationId);
        // Refresh conversation history sidebar
        refetchConversations();
      }
    }

    // Save user message to database
    if (conversationId) {
      await addMessage(conversationId, "user", textToSend);
    }

    const context = {
      sheetData: uploadedImage?.data || uploadedSheet?.data || sheetData,
      glossaryTerms: glossaryTerms.length > 0 ? glossaryTerms : undefined,
      existingWidgets: existingWidgets.length > 0 ? existingWidgets : undefined,
      hasUploadedSheet: !!(uploadedSheet || uploadedImage),
      model: "google/gemini-2.5-pro",
    };

    const timeoutId = setTimeout(() => {
      if (isStreaming) {
        console.error("[AI Chat] Request timeout after 30s");
        setStreamError("Request timed out. Please try again.");
        setIsStreaming(false);
      }
    }, 30000);

    try {
      await streamChat({
        messages: [...messages, userMessage],
        context,
        onDelta: (delta) => {
          hasReceivedContent = true;
          streamingMessageRef.current += delta;
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: "assistant",
              content: streamingMessageRef.current,
            };
            return newMessages;
          });
        },
        onToolCall: (toolCall) => {
          console.log("[AI Chat] Tool call received:", toolCall.name);
          currentToolCalls.push(toolCall);
          if (toolCall.name === "generate_widgets" && onAcceptWidget) {
            if (!hasReceivedContent) {
              const count = toolCall.arguments.widgets?.length || 1;
              streamingMessageRef.current = count > 1 
                ? `Here are ${count} widgets I created based on your data:`
                : "Here's a widget I created based on your request:";
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: streamingMessageRef.current,
                };
                return newMessages;
              });
            }
            const widgets = toolCall.arguments.widgets || [toolCall.arguments];
            console.log("[AI Chat] Generated widgets:", widgets.length);
            
            // Analyze widgets for issues and auto-fix problems
            const { analyzedWidgets, feedback } = analyzeWidgetSuggestions(widgets);
            console.log("[AI Chat] Widget analysis feedback:", Object.fromEntries(feedback));
            
            setSuggestedWidgets(analyzedWidgets);
            setWidgetFeedback(feedback);
          }
        },
        onDone: async () => {
          console.log("[AI Chat] Streaming completed");
          clearTimeout(timeoutId);
          setIsStreaming(false);
          
          // Save assistant message with tool calls
          if (conversationId && streamingMessageRef.current) {
            await addMessage(conversationId, "assistant", streamingMessageRef.current, currentToolCalls);
          }
          streamingMessageRef.current = "";
        },
        onError: (error) => {
          console.error("[AI Chat] Stream error:", error);
          clearTimeout(timeoutId);
          setStreamError(error);
          setIsStreaming(false);
          streamingMessageRef.current = "";
          setMessages((prev) => prev.slice(0, -1));
        },
      });
    } catch (error) {
      console.error("[AI Chat] Error in AI chat:", error);
      clearTimeout(timeoutId);
      setStreamError(error instanceof Error ? error.message : "Failed to connect to AI");
      setIsStreaming(false);
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setSuggestedWidgets([]);
    setUploadedSheet(null);
    setUploadedImage(null);
    setStreamError(null);
    console.log("[AI Chat] Started new chat");
  };

  const handleAcceptWidget = (widget: WidgetSuggestion) => {
    if (onAcceptWidget) {
      const dataToPass = uploadedImage?.data || uploadedSheet?.data || sheetData;
      onAcceptWidget(widget, dataToPass);
      setSuggestedWidgets((prev) => prev.filter((w) => w !== widget));
    }
  };

  const handleAcceptAll = () => {
    const dataToPass = uploadedImage?.data || uploadedSheet?.data || sheetData;
    suggestedWidgets.forEach((widget) => {
      if (onAcceptWidget) {
        onAcceptWidget(widget, dataToPass);
      }
    });
    setSuggestedWidgets([]);
  };

  const handleRejectWidget = (widget: WidgetSuggestion) => {
    setSuggestedWidgets((prev) => prev.filter((w) => w !== widget));
  };

  const handleRejectAll = () => {
    setSuggestedWidgets([]);
  };

  const handleClearConversation = () => {
    handleNewChat();
  };

  const hasContext = (uploadedImage?.data?.length ?? uploadedSheet?.data?.length ?? sheetData?.length ?? 0) > 0 || glossaryTerms.length > 0 || existingWidgets.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" size={20} />
              AI Dashboard Assistant
            </DialogTitle>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </span>
                </Button>
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button variant="outline" size="sm" asChild disabled={isExtractingImage}>
                  <span className="cursor-pointer">
                    {isExtractingImage ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4 mr-2" />
                    )}
                    Upload Image
                  </span>
                </Button>
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearConversation}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          
          {hasContext && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {uploadedImage && (
                <Badge variant="secondary" className="text-xs">
                  🖼️ {uploadedImage.name} ({uploadedImage.data.length - 1} rows extracted)
                  <X
                    className="h-3 w-3 ml-2 cursor-pointer"
                    onClick={() => {
                      URL.revokeObjectURL(uploadedImage.preview);
                      setUploadedImage(null);
                    }}
                  />
                </Badge>
              )}
              {uploadedSheet && !uploadedImage && (
                <Badge variant="secondary" className="text-xs">
                  📄 {uploadedSheet.name} ({uploadedSheet.data.length - 1} rows)
                  <X
                    className="h-3 w-3 ml-2 cursor-pointer"
                    onClick={() => setUploadedSheet(null)}
                  />
                </Badge>
              )}
              {!uploadedSheet && !uploadedImage && sheetData && sheetData.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Database className="h-3 w-3 mr-1" />
                  Sheet Data ({sheetData.length - 1} rows)
                </Badge>
              )}
              {glossaryTerms.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {glossaryTerms.length} Glossary Terms
                </Badge>
              )}
              {existingWidgets.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Boxes className="h-3 w-3 mr-1" />
                  {existingWidgets.length} Widgets
                </Badge>
              )}
            </div>
          )}

          {/* CSV Data Preview */}
          {(uploadedSheet || uploadedImage) && (() => {
            const data = uploadedImage?.data || uploadedSheet?.data || [];
            const headers = data[0] || [];
            const dataRows = data.slice(1);
            
            // Detect column types
            const columnTypes = headers.map((_: string, colIndex: number) => {
              const columnValues = dataRows.map(row => row[colIndex]);
              return detectColumnType(columnValues);
            });
            
            const previewRows = dataRows.slice(0, 5);
            const remainingRows = Math.max(0, dataRows.length - 5);
            const rowCount = dataRows.length;
            const colCount = headers.length;

            return (
              <Collapsible open={showDataPreview} onOpenChange={setShowDataPreview} className="mt-3">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span className="text-xs">
                      Preview Data ({rowCount} rows, {colCount} columns)
                    </span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", showDataPreview && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="max-h-48 overflow-auto border rounded-md mt-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {headers.map((header: string, i: number) => (
                            <TableHead key={i} className="text-xs">
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground font-mono text-[10px]">
                                  {getTypeIcon(columnTypes[i])}
                                </span>
                                <span>{header}</span>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewRows.map((row: any[], rowIndex: number) => (
                          <TableRow key={rowIndex}>
                            {row.map((cell: any, cellIndex: number) => {
                              const type = columnTypes[cellIndex];
                              const formatted = formatCellValue(cell, type);
                              const isNumber = type === 'number' || type === 'currency' || type === 'percentage';
                              
                              return (
                                <TableCell 
                                  key={cellIndex} 
                                  className={cn(
                                    "text-xs",
                                    isNumber && "text-right font-mono"
                                  )}
                                >
                                  {formatted}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                        {remainingRows > 0 && (
                          <TableRow>
                            <TableCell colSpan={headers.length} className="text-center text-xs text-muted-foreground">
                              + {remainingRows} more rows
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })()}
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          <ConversationHistory
            onSelectConversation={setCurrentConversationId}
            currentConversationId={currentConversationId}
          />

          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 px-6 py-4">
              <div ref={scrollViewportRef}>
                {messagesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">How can I help you build your dashboard?</h3>
                  <p className="text-sm text-muted-foreground">
                    {!hasContext ? (
                      <>Upload a CSV or add a sheet to the canvas to get data-driven suggestions</>
                    ) : (
                      <>I can help you create widgets, understand your data, and build effective visualizations.</>
                    )}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                  {quickActions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="h-auto py-3 flex flex-col items-start gap-2"
                      onClick={() => {
                        console.log("[AI Chat] Quick action clicked:", action.label);
                        handleSend(action.label);
                      }}
                      disabled={isStreaming}
                    >
                      <action.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm text-left">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {messages.map((msg, idx) => (
                  <AiChatMessage 
                    key={idx} 
                    role={msg.role} 
                    content={msg.content}
                    isLoading={msg.role === "assistant" && !msg.content && isStreaming}
                  />
                ))}
                
                {streamError && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mt-4">
                    Error: {streamError}
                  </div>
                )}
                
                {suggestedWidgets.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {/* Feedback Analysis Panel */}
                    {widgetFeedback.size > 0 && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>AI Output Analysis</AlertTitle>
                        <AlertDescription className="space-y-1 text-xs">
                          {Array.from(widgetFeedback.entries()).map(([idx, items]) => (
                            <div key={idx} className="border-l-2 border-primary/30 pl-2">
                              <strong>Widget #{idx + 1} ({suggestedWidgets[idx].title}):</strong>
                              <ul className="ml-4 mt-1 space-y-0.5">
                                {items.map((feedback, i) => (
                                  <li key={i} className={cn(
                                    feedback.type === 'auto-fixed' && "text-secondary-foreground",
                                    feedback.type === 'warning' && "text-destructive",
                                    feedback.type === 'info' && "text-muted-foreground"
                                  )}>
                                    {feedback.type === 'auto-fixed' && '🔧 '}
                                    {feedback.type === 'warning' && '⚠️ '}
                                    {feedback.type === 'info' && 'ℹ️ '}
                                    {feedback.message}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {suggestedWidgets.length > 1 && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAcceptAll} className="flex-1">
                          Add All {suggestedWidgets.length} Widgets
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleRejectAll}>
                          Reject All
                        </Button>
                      </div>
                    )}
                    <div className="space-y-2">
                      {suggestedWidgets.map((widget, index) => {
                        const feedback = widgetFeedback.get(index);
                        const badge = feedback ? getWidgetBadge(feedback) : null;
                        
                        return (
                          <Card key={index} className="p-4 border-primary">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge>{widget.widgetType}</Badge>
                                  {badge && (
                                    <Badge variant={badge.variant}>
                                      {badge.icon} {badge.text}
                                    </Badge>
                                  )}
                                  <h4 className="font-semibold">{widget.title}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {widget.description}
                                </p>
                                {widget.formula && (
                                  <div className="text-xs text-muted-foreground">
                                    Formula: {widget.formula.operation} on {widget.formula.sourceColumn}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleAcceptWidget(widget)}>
                                  <Check className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleRejectWidget(widget)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask me anything about your dashboard..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="min-h-[60px] max-h-[120px] resize-none"
                  disabled={isStreaming}
                />
                <Button
                  size="icon"
                  className="h-[60px] w-[60px] flex-shrink-0"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isStreaming}
                >
                  {isStreaming ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
