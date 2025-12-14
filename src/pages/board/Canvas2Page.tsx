import { useParams } from "react-router-dom";
import { Canvas2 } from "@/components/canvas";

export default function Canvas2Page() {
  const { boardId } = useParams();

  if (!boardId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a project</p>
      </div>
    );
  }

  return <Canvas2 projectId={boardId} />;
}
