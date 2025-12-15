import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PlatformStat {
  name: string;
  icon: string;
  reach: string;
  engagement: string;
  progress: number;
  color: string;
}

const platforms: PlatformStat[] = [
  { 
    name: "Instagram", 
    icon: "📸", 
    reach: "450K", 
    engagement: "5.2%", 
    progress: 75,
    color: "bg-pink-500"
  },
  { 
    name: "Facebook", 
    icon: "📘", 
    reach: "280K", 
    engagement: "3.8%", 
    progress: 55,
    color: "bg-blue-600"
  },
  { 
    name: "TikTok", 
    icon: "🎵", 
    reach: "620K", 
    engagement: "8.1%", 
    progress: 90,
    color: "bg-foreground"
  },
  { 
    name: "Twitter/X", 
    icon: "🐦", 
    reach: "180K", 
    engagement: "2.4%", 
    progress: 35,
    color: "bg-sky-500"
  },
];

export function PlatformBreakdown() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Platform Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {platforms.map((platform) => (
          <div key={platform.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{platform.icon}</span>
                <span className="font-medium text-sm text-foreground">{platform.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-foreground">{platform.reach}</span>
                <span className="text-xs text-muted-foreground ml-2">reach</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={platform.progress} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground w-12">{platform.engagement}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
