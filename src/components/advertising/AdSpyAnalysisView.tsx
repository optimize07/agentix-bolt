import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AdSpyAnalysisViewProps {
  ad: any;
  analysis: any;
}

const AdSpyAnalysisView = ({ ad, analysis }: AdSpyAnalysisViewProps) => {
  if (!analysis) {
    return (
      <Card className="p-6 bg-card border-border">
        <p className="text-muted-foreground text-center">
          No analysis available yet. The AI is still processing this ad.
        </p>
      </Card>
    );
  }

  const sections = [
    { label: "Hook", value: analysis.hook, color: "bg-primary" },
    { label: "Angle", value: analysis.angle, color: "bg-accent" },
    { label: "Emotion", value: analysis.emotion, color: "bg-secondary" },
    { label: "CTA", value: analysis.cta, color: "bg-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Ad Preview */}
      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
        {ad.video_url ? (
          <video
            src={ad.video_url}
            className="w-full h-full object-cover"
            controls
          />
        ) : ad.image_url ? (
          <img
            src={ad.image_url}
            alt="Ad creative"
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>

      {/* Ad Copy */}
      {ad.ad_copy && (
        <Card className="p-4 bg-card border-border">
          <h4 className="font-semibold text-foreground mb-2">Ad Copy</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {ad.ad_copy}
          </p>
        </Card>
      )}

      <Separator />

      {/* Analysis Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Card key={section.label} className="p-4 bg-card border-border">
            <Badge className={`${section.color} mb-2`}>{section.label}</Badge>
            <p className="text-sm text-foreground">
              {section.value || "Not analyzed"}
            </p>
          </Card>
        ))}
      </div>

      {/* Script Summary */}
      {analysis.script_summary && (
        <Card className="p-4 bg-card border-border">
          <h4 className="font-semibold text-foreground mb-2">Script Summary</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {analysis.script_summary}
          </p>
        </Card>
      )}

      {/* Why It Works */}
      {analysis.why_it_works && (
        <Card className="p-4 bg-accent/20 border-accent">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-accent">💡</span>
            Why This Works
          </h4>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {analysis.why_it_works}
          </p>
        </Card>
      )}
    </div>
  );
};

export default AdSpyAnalysisView;
