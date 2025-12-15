import React, { useState, useCallback } from 'react';
import { NodeProps } from '@xyflow/react';
import { Palette, Check, X, Edit2, Save, Copy, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CanvasNodeData } from '@/types/canvas';
import { toast } from 'sonner';
import BaseNode from './BaseNode';

type CreativeStatus = 'draft' | 'review' | 'approved' | 'rejected';

const statusConfig: Record<CreativeStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'secondary' },
  review: { label: 'In Review', color: 'default' },
  approved: { label: 'Approved', color: 'default' },
  rejected: { label: 'Rejected', color: 'destructive' },
};

const CreativeNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CanvasNodeData;
  const [localTitle, setLocalTitle] = useState(nodeData.title || 'Ad Creative');
  
  // Initialize from metadata (supports push from ChatNode)
  const initialMetadata = nodeData.metadata || {};
  const [headline, setHeadline] = useState(initialMetadata.headline || '');
  const [primaryText, setPrimaryText] = useState(initialMetadata.primaryText || '');
  const [cta, setCta] = useState(initialMetadata.cta || 'Shop Now');
  const [imageUrl, setImageUrl] = useState(nodeData.fileUrl || initialMetadata.imageUrl || '');
  const [status, setStatus] = useState<CreativeStatus>(initialMetadata.status || 'draft');
  const [isEditing, setIsEditing] = useState(false);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value);
    nodeData.onTitleChange?.(e.target.value);
  }, [nodeData]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    nodeData.onContentChange?.(JSON.stringify({
      headline,
      primaryText,
      cta,
      imageUrl,
      status,
    }));
    toast.success('Creative saved');
  }, [headline, primaryText, cta, imageUrl, status, nodeData]);

  const handleApprove = useCallback(() => {
    setStatus('approved');
    toast.success('Creative approved!');
  }, []);

  const handleReject = useCallback(() => {
    setStatus('rejected');
    toast.info('Creative rejected');
  }, []);

  const copyAll = useCallback(() => {
    const text = `Headline: ${headline}\n\nPrimary Text: ${primaryText}\n\nCTA: ${cta}`;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, [headline, primaryText, cta]);

  const statusInfo = statusConfig[status];

  return (
    <BaseNode
      selected={selected}
      onDelete={nodeData.onDelete}
      color="#f97316"
      showTargetHandle={true}
      showSourceHandle={false}
      className="min-w-[320px]"
      headerContent={
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Palette className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
          <Input
            value={localTitle}
            onChange={handleTitleChange}
            className="h-5 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 font-medium truncate nodrag"
            placeholder="Creative name..."
          />
          <Badge 
            variant={statusInfo.color as any} 
            className={`text-[10px] h-4 px-1.5 ${status === 'approved' ? 'bg-green-500/20 text-green-500' : ''}`}
          >
            {statusInfo.label}
          </Badge>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Image preview */}
        {imageUrl ? (
          <div className="relative group rounded-md overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt="Creative"
              className="w-full h-auto max-h-[150px] object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(imageUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Full
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-[80px] rounded-md border border-dashed flex items-center justify-center bg-muted/30">
            <p className="text-xs text-muted-foreground">No image attached</p>
          </div>
        )}

        <Separator />

        {/* Headline */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Headline
          </label>
          {isEditing ? (
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="text-xs mt-1"
              placeholder="Enter headline..."
            />
          ) : (
            <p className="text-sm font-medium mt-0.5">
              {headline || <span className="text-muted-foreground italic">No headline</span>}
            </p>
          )}
        </div>

        {/* Primary Text */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Primary Text
          </label>
          {isEditing ? (
            <Textarea
              value={primaryText}
              onChange={(e) => setPrimaryText(e.target.value)}
              className="text-xs mt-1 min-h-[60px]"
              placeholder="Enter primary text..."
            />
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">
              {primaryText || <span className="italic">No primary text</span>}
            </p>
          )}
        </div>

        {/* CTA */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Call to Action
          </label>
          {isEditing ? (
            <Input
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              className="text-xs mt-1"
              placeholder="e.g., Shop Now"
            />
          ) : (
            <Badge variant="outline" className="text-xs mt-1">
              {cta || 'No CTA'}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          {isEditing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="h-7 text-xs">
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            </>
          ) : (
            <>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-7 text-xs">
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={copyAll} className="h-7 text-xs">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              {status !== 'approved' && status !== 'rejected' && (
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleReject}
                    className="h-7 text-xs text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleApprove}
                    className="h-7 text-xs bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </BaseNode>
  );
};

export default CreativeNode;
