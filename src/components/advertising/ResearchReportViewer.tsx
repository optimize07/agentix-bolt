import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Download, Copy, Check, FileText, Save, Database, Eye, Pencil } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ResearchReportViewerProps {
  content: string;
  companyName: string;
  reportId: string;
}

export const ResearchReportViewer = ({ content, companyName, reportId }: ResearchReportViewerProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingToKB, setIsSendingToKB] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("market_research_reports")
        .update({ report_content: editedContent })
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Report Saved",
        description: "Your changes have been saved successfully",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving report:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendToKnowledgeBase = async () => {
    setIsSendingToKB(true);
    try {
      // TODO: Implement knowledge base integration
      toast({
        title: "Knowledge Base Integration",
        description: "This feature will be available soon. The report will be saved to the client's knowledge base.",
      });
      
      // Placeholder for future implementation
      // await supabase.functions.invoke('send-to-knowledge-base', {
      //   body: { reportId, content: editedContent, companyName }
      // });
      
    } catch (error) {
      console.error("Error sending to knowledge base:", error);
      toast({
        title: "Failed to Send",
        description: "Could not send to knowledge base. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingToKB(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "The report has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy report to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([editedContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `market-research-${companyName.replace(/\s+/g, "-").toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Markdown Downloaded",
      description: "Your report has been downloaded as .md file",
    });
  };

  const handleDownloadPDF = () => {
    toast({
      title: "PDF Export",
      description: "Use your browser's Print to PDF feature (Ctrl+P or Cmd+P) to save as PDF",
    });
    window.print();
  };

  // Simple markdown to HTML converter for basic formatting
  const formatContent = (text: string) => {
    return text
      .split("\n")
      .map((line, i) => {
        // Headers
        if (line.startsWith("# ")) {
          return `<h1 key=${i} class="text-3xl font-bold mt-8 mb-4">${line.substring(2)}</h1>`;
        }
        if (line.startsWith("## ")) {
          return `<h2 key=${i} class="text-2xl font-semibold mt-6 mb-3">${line.substring(3)}</h2>`;
        }
        if (line.startsWith("### ")) {
          return `<h3 key=${i} class="text-xl font-semibold mt-4 mb-2">${line.substring(4)}</h3>`;
        }
        // Bold
        line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Italic
        line = line.replace(/\*(.+?)\*/g, '<em>$1</em>');
        // Lists
        if (line.startsWith("- ")) {
          return `<li key=${i} class="ml-4">${line.substring(2)}</li>`;
        }
        // Horizontal rule
        if (line.trim() === "---") {
          return `<hr key=${i} class="my-8 border-border" />`;
        }
        // Paragraph
        if (line.trim()) {
          return `<p key=${i} class="mb-2">${line}</p>`;
        }
        return `<br key=${i} />`;
      })
      .join("");
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-2xl font-bold">Market Research Report</h2>
          <div className="flex gap-2 flex-wrap">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => {
                  setEditedContent(content);
                  setIsEditing(false);
                }}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadMarkdown}>
                  <FileText className="h-4 w-4 mr-2" />
                  .md
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button size="sm" onClick={handleSendToKnowledgeBase} disabled={isSendingToKB}>
                  <Database className="h-4 w-4 mr-2" />
                  {isSendingToKB ? "Sending..." : "Send to Knowledge Base"}
                </Button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-[600px] font-mono text-sm"
            placeholder="Edit your report content here..."
          />
        ) : (
          <ScrollArea className="h-[600px] rounded-md border p-6">
            <div
              id="report-content"
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: formatContent(editedContent) }}
            />
          </ScrollArea>
        )}
      </div>
    </Card>
  );
};