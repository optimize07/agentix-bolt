import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Image as ImageIcon, Video, FileText } from "lucide-react";

interface OfferCardProps {
  offer: any;
  groups: any[];
  onEdit: (offer: any) => void;
  onDelete: (id: string) => void;
}

export function OfferCard({ offer, groups, onEdit, onDelete }: OfferCardProps) {
  const group = groups.find((g) => g.id === offer.group_id);
  const hasAssets = offer.offer_assets && offer.offer_assets.length > 0;

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Card className="relative group">
      {/* Group Indicator */}
      {group && (
        <div
          className="absolute top-3 left-3 w-3 h-3 rounded-full"
          style={{ backgroundColor: group.color }}
          title={group.name}
        />
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{offer.name}</CardTitle>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(offer)}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(offer.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        {offer.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{offer.description}</p>
        )}

        {/* Price & Discount */}
        <div className="flex gap-2 flex-wrap">
          {offer.price && (
            <Badge variant="secondary" className="font-mono">
              {offer.price}
            </Badge>
          )}
          {offer.discount && (
            <Badge variant="default" className="bg-accent text-accent-foreground">
              {offer.discount}
            </Badge>
          )}
        </div>

        {/* Guarantee */}
        {offer.guarantee && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Guarantee:</span> {offer.guarantee}
          </div>
        )}

        {/* USP */}
        {offer.usp && (
          <div className="text-xs">
            <span className="font-medium text-foreground">USP:</span>
            <p className="text-muted-foreground line-clamp-2 mt-1">{offer.usp}</p>
          </div>
        )}

        {/* CTA */}
        {offer.cta && (
          <div className="text-xs">
            <span className="font-medium text-foreground">CTA:</span>{" "}
            <span className="text-muted-foreground">{offer.cta}</span>
          </div>
        )}

        {/* Assets Preview */}
        {hasAssets && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">Assets:</span>
              {offer.offer_assets.map((asset: any) => (
                <div
                  key={asset.id}
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                >
                  {getAssetIcon(asset.type)}
                  <span className="truncate max-w-[100px]">{asset.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {offer.tags && offer.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap pt-2">
            {offer.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

