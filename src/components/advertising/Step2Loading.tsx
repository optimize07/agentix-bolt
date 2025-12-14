import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Step2Loading({
  phases,
  phaseIndex,
  skeletonCount = 3,
  builtCount = 0,
}: {
  phases: string[];
  phaseIndex: number;
  skeletonCount?: number;
  builtCount?: number;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Building your ads…</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {phases.map((p, i) => (
              <li key={p} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${i < phaseIndex ? "bg-emerald-500" : i === phaseIndex ? "bg-yellow-500 animate-pulse" : "bg-muted"}`} />
                <span className={i < phaseIndex ? "text-foreground" : "text-muted-foreground"}>{p}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Card key={i} className={i < builtCount ? "" : "animate-pulse"}>
            <CardContent className="p-4 space-y-3">
              <div className="h-4 w-2/3 bg-muted rounded" />
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-5/6 bg-muted rounded" />
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-muted rounded" />
                <div className="h-8 w-20 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}





