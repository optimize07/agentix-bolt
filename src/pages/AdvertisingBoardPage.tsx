import BoardLayout from "@/pages/board/BoardLayout";
import { AdvertisingSidebar } from "@/components/AdvertisingSidebar";

const AdvertisingBoardPage = () => {
  return (
    <div className="flex min-h-screen w-full">
      <AdvertisingSidebar />
      <div className="flex-1 flex flex-col">
        <BoardLayout />
      </div>
    </div>
  );
};

export default AdvertisingBoardPage;

