import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Image, FileText, Link, File } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Asset {
  id: string;
  name: string;
  type: string;
  tags: string[] | null;
  url_or_path: string | null;
  text_content: string | null;
}

interface AssetSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (assets: Asset[]) => void;
  multiSelect?: boolean;
}

export default function AssetSelectorModal({
  open,
  onOpenChange,
  onSelect,
  multiSelect = false,
}: AssetSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Asset[];
    },
  });

  const filteredAssets = assets.filter((asset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-5 h-5" />;
      case "text":
        return <FileText className="w-5 h-5" />;
      case "url":
        return <Link className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const handleSelect = (asset: Asset) => {
    if (multiSelect) {
      const isSelected = selectedAssets.some((a) => a.id === asset.id);
      if (isSelected) {
        setSelectedAssets(selectedAssets.filter((a) => a.id !== asset.id));
      } else {
        setSelectedAssets([...selectedAssets, asset]);
      }
    } else {
      onSelect([asset]);
      onOpenChange(false);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedAssets);
    setSelectedAssets([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px]">
        <DialogHeader>
          <DialogTitle>Select Assets</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search assets..."
            className="pl-10"
          />
        </div>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 gap-3 pr-4">
            {filteredAssets.map((asset) => {
              const isSelected = selectedAssets.some((a) => a.id === asset.id);
              return (
                <Card
                  key={asset.id}
                  className={`p-3 cursor-pointer hover:border-primary/50 transition-colors ${
                    isSelected ? "border-primary" : ""
                  }`}
                  onClick={() => handleSelect(asset)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-primary">{getAssetIcon(asset.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{asset.name}</h4>
                      <Badge variant="outline" className="text-xs mt-1">
                        {asset.type}
                      </Badge>
                      {asset.tags && asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {asset.tags.slice(0, 2).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        {multiSelect && selectedAssets.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedAssets.length} selected
            </p>
            <Button onClick={handleConfirm}>Attach Selected</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
