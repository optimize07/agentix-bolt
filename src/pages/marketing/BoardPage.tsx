import BoardLayout from "@/pages/board/BoardLayout";
import { MarketingSidebar } from "@/components/MarketingSidebar";

const MarketingBoardPage = () => {
  return (
    <div className="flex min-h-screen w-full">
      <MarketingSidebar />
      <div className="flex-1 flex flex-col">
        <BoardLayout />
      </div>
    </div>
  );
};

export default MarketingBoardPage;
