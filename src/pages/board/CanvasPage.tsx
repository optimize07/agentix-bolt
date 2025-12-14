import { useParams } from "react-router-dom";
import { Canvas } from "@/components/canvas";

export default function CanvasPage() {
  const { boardId } = useParams();

  if (!boardId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No board selected</p>
      </div>
    );
  }

  return <Canvas projectId={boardId} />;
}
