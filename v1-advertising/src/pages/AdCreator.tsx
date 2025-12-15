import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AdCreator() {
  const { selectedProjectId } = useProject();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (!selectedProjectId) {
      toast({
        title: "No project selected",
        description: "Please select a project to generate ads.",
        variant: "destructive",
      });
      return;
    }

    const userMessage = { role: "user", content: message };
    setMessages([...messages, userMessage]);
    setMessage("");

    toast({
      title: "AI Generation",
      description: "Nanobanan integration coming soon! This will generate creative assets.",
    });

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "AI-generated creatives will appear here. Integration with Nanobanan coming soon!",
        },
      ]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Create High-Converting Ads
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Describe the ad you want to create. Reference assets from your library
                  and leverage your knowledge base for best results.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <Card
              key={idx}
              className={`p-4 ${
                msg.role === "user"
                  ? "bg-primary/5 ml-12"
                  : "bg-muted/30 mr-12"
              }`}
            >
              <p className="text-sm text-foreground">{msg.content}</p>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-border bg-card p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the ad creative you want to generate..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button onClick={handleSendMessage} size="lg" className="shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
