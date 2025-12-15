import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Search, Calendar, Trash2, Maximize2, Minimize2, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext } from "@dnd-kit/sortable";

const CARD_STATUS = {
  AI_DRAFT: "AI_DRAFT",
  REVIEWED: "REVIEWED",
  READY_TO_LAUNCH: "READY_TO_LAUNCH",
  LAUNCHED: "LAUNCHED",
} as const;

type KanbanColumn = {
  id: string;
  title: string;
  status: string;
};

const columns: KanbanColumn[] = [
  { id: "drafts", title: "AI Drafts", status: CARD_STATUS.AI_DRAFT },
  { id: "reviewed", title: "Reviewed", status: CARD_STATUS.REVIEWED },
  { id: "ready", title: "Ready to Launch", status: CARD_STATUS.READY_TO_LAUNCH },
  { id: "launched", title: "Launched", status: CARD_STATUS.LAUNCHED },
];

interface CreativeCard {
  id: string;
  title: string;
  headline: string | null;
  primary_text: string | null;
  description_text: string | null;
  image_url: string | null;
  tags: string[] | null;
  status: string;
  notes: string | null;
}

function SortableCard({ card, onClick, selected, onToggleSelect, onDelete }: { 
  card: CreativeCard; 
  onClick: () => void; 
  selected: boolean; 
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [showDelete, setShowDelete] = useState(false);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <Card
        className={`p-3 cursor-pointer hover:border-primary/50 transition-colors mb-3 relative ${selected ? "border-primary" : ""}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(card.id)}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          />
          {showDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>
        {card.image_url && (
          <img
            src={card.image_url}
            alt={card.title}
            className="w-full h-32 object-cover rounded-md mb-2"
          />
        )}
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-medium text-foreground line-clamp-2 flex-1">
            {card.title}
          </p>
        </div>
        {card.headline && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {card.headline}
          </p>
        )}
      </Card>
    </div>
  );
}

function DroppableColumn({ 
  column, 
  children,
}: { 
  column: KanbanColumn; 
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <Card 
      ref={setNodeRef}
      className={`flex flex-col bg-card/50 border-border transition-all ${
        isOver ? "ring-2 ring-primary" : ""
      }`}
    >
      {children}
    </Card>
  );
}

export default function Kanban() {
  const { boardId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<CreativeCard | null>(null);
  const [originalCard, setOriginalCard] = useState<CreativeCard | null>(null);
  const [launchDialogOpen, setLaunchDialogOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targeting, setTargeting] = useState("broad");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [unsavedWarningOpen, setUnsavedWarningOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const { data: cards, isLoading, isError, error } = useQuery({
    queryKey: ["creative-cards", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creative_cards")
        .select("*")
        .eq("agent_board_id", boardId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CreativeCard[];
    },
    enabled: !!boardId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ cardId, newStatus }: { cardId: string; newStatus: string }) => {
      const { error } = await supabase
        .from("creative_cards")
        .update({ status: newStatus })
        .eq("id", cardId);
      if (error) throw error;
    },
    onMutate: async ({ cardId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["creative-cards", boardId] });
      const previousCards = queryClient.getQueryData(["creative-cards", boardId]);
      
      queryClient.setQueryData(["creative-cards", boardId], (old: CreativeCard[] | undefined) =>
        old?.map(card => card.id === cardId ? { ...card, status: newStatus } : card)
      );
      
      return { previousCards };
    },
    onError: (error, variables, context) => {
      if (context?.previousCards) {
        queryClient.setQueryData(["creative-cards", boardId], context.previousCards);
      }
      toast({ 
        title: "Update Failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["creative-cards", boardId] });
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async (updates: Partial<CreativeCard> & { id: string }) => {
      const { error } = await supabase
        .from("creative_cards")
        .update(updates)
        .eq("id", updates.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creative-cards", boardId] });
      setSelectedCard(null);
      setOriginalCard(null);
      toast({ title: "Card Updated", description: "Changes saved successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Update Failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from("creative_cards")
        .delete()
        .eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creative-cards", boardId] });
      setSelectedCard(null);
      setOriginalCard(null);
      setDeleteDialogOpen(false);
      setCardToDelete(null);
      toast({ title: "Card Deleted", description: "Card removed successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Delete Failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleDeleteClick = (cardId: string) => {
    setCardToDelete(cardId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (cardToDelete) {
      deleteCardMutation.mutate(cardToDelete);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const cardId = active.id as string;
    
    // over.id could be a column ID or a card ID
    const targetColumn = columns.find(col => 
      col.id === over.id || 
      cardsByColumn[col.status]?.some(c => c.id === over.id)
    );
    
    if (targetColumn) {
      const currentCard = cards?.find(c => c.id === cardId);
      // Only update if status actually changed
      if (currentCard && currentCard.status !== targetColumn.status) {
        updateStatusMutation.mutate({ cardId, newStatus: targetColumn.status });
      }
    }
  };

  const handleLaunch = () => {
    if (!selectedCard) return;
    
    toast({
      title: "Launching Campaign",
      description: "Integration with Composio coming soon. Campaign would be created on Meta/Facebook.",
    });
    
    updateCardMutation.mutate({ id: selectedCard.id, status: CARD_STATUS.LAUNCHED });
    setLaunchDialogOpen(false);
  };

  const cardsByColumn = useMemo(() => {
    if (!cards) return {} as Record<string, CreativeCard[]>;
    
    return columns.reduce((acc, col) => {
      acc[col.status] = cards.filter(card => {
        const matchesStatus = card.status === col.status;
        const matchesSearch = searchTerm
          ? card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            card.headline?.toLowerCase().includes(searchTerm.toLowerCase())
          : true;
        return matchesStatus && matchesSearch;
      });
      return acc;
    }, {} as Record<string, CreativeCard[]>);
  }, [cards, searchTerm]);

  const toggleCardSelection = (id: string) => {
    setSelectedCards((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    try {
      await Promise.all(
        selectedCards.map(cardId => 
          updateStatusMutation.mutateAsync({ cardId, newStatus })
        )
      );
      setSelectedCards([]);
      toast({
        title: "Bulk Update Complete",
        description: `${selectedCards.length} cards moved to ${columns.find((c) => c.status === newStatus)?.title}`,
      });
    } catch (error) {
      toast({ 
        title: "Bulk Update Failed", 
        description: "Some cards could not be updated",
        variant: "destructive" 
      });
    }
  };
  
  const hasUnsavedChanges = selectedCard && originalCard && (
    selectedCard.headline !== originalCard.headline ||
    selectedCard.primary_text !== originalCard.primary_text ||
    selectedCard.notes !== originalCard.notes
  );

  const handleCardClick = (card: CreativeCard) => {
    setSelectedCard(card);
    setOriginalCard(card);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setUnsavedWarningOpen(true);
    } else if (!open) {
      setSelectedCard(null);
      setOriginalCard(null);
    }
  };

  const confirmDiscardChanges = () => {
    setSelectedCard(null);
    setOriginalCard(null);
    setUnsavedWarningOpen(false);
  };

  const activeCard = cards?.find((card) => card.id === activeId);

  if (!boardId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a project</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive text-lg font-semibold mb-2">Error loading cards</p>
          <p className="text-muted-foreground text-sm">{error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="h-full flex flex-col bg-muted/10">
          <div className="p-6 pb-4 border-b bg-card">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search cards..."
                  className="pl-10"
                />
              </div>
              {selectedCards.length > 0 && (
                <>
                  <Badge variant="secondary">{selectedCards.length} selected</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdateStatus(CARD_STATUS.REVIEWED)}
                  >
                    Move to Reviewed
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 p-6 overflow-auto">
            <div 
              className="grid gap-4 h-full transition-all" 
              style={
                expandedColumn
                  ? {
                      gridTemplateColumns: columns
                        .map((c) => (c.id === expandedColumn ? "1fr" : "80px"))
                        .join(" "),
                    }
                  : { gridTemplateColumns: "repeat(4, 1fr)" }
              }
            >
              {columns.map((column) => {
                const columnCards = cardsByColumn[column.status] || [];
                const isExpanded = expandedColumn === column.id;
                const isCollapsed = expandedColumn && !isExpanded;

                if (isCollapsed) {
                  return (
                    <div
                      key={column.id}
                      className="cursor-pointer hover:bg-accent/50 rounded-lg p-3 flex flex-col items-center gap-2 border border-border bg-card/50"
                      onClick={() => setExpandedColumn(column.id)}
                    >
                      <p className="text-xs font-semibold [writing-mode:vertical-lr] rotate-180">
                        {column.title}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {columnCards.length}
                      </Badge>
                    </div>
                  );
                }

                return (
                  <DroppableColumn
                    key={column.id}
                    column={column}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {column.title}
                          <Badge variant="secondary" className="ml-2">
                            {columnCards.length}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedColumn(isExpanded ? null : column.id);
                          }}
                        >
                          {isExpanded ? (
                            <Minimize2 className="h-4 w-4" />
                          ) : (
                            <Maximize2 className="h-4 w-4" />
                          )}
                        </Button>
                      </CardTitle>
                    </CardHeader>

                    <ScrollArea className="flex-1 px-4 pb-4">
                      <SortableContext items={columnCards.map((c) => c.id)} id={column.id}>
                        <div 
                          className={`min-h-[200px] ${
                            isExpanded ? "grid grid-cols-3 gap-3" : ""
                          }`}
                        >
                          {columnCards.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-8 col-span-3">
                              No cards yet
                            </p>
                          ) : (
                            columnCards.map((card) => (
                              <SortableCard
                                key={card.id}
                                card={card}
                                onClick={() => handleCardClick(card)}
                                selected={selectedCards.includes(card.id)}
                                onToggleSelect={toggleCardSelection}
                                onDelete={handleDeleteClick}
                              />
                            ))
                          )}
                        </div>
                      </SortableContext>
                    </ScrollArea>
                  </DroppableColumn>
                );
              })}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <Card className="p-3 opacity-90">
              <p className="text-sm font-medium">{activeCard.title}</p>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Card Detail Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCard?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedCard?.image_url && (
              <img
                src={selectedCard.image_url}
                alt={selectedCard.title}
                className="w-full h-64 object-cover rounded-md"
              />
            )}
            
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={selectedCard?.headline || ""}
                onChange={(e) =>
                  setSelectedCard((prev) =>
                    prev ? { ...prev, headline: e.target.value } : null
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Primary Text</Label>
              <Textarea
                value={selectedCard?.primary_text || ""}
                onChange={(e) =>
                  setSelectedCard((prev) =>
                    prev ? { ...prev, primary_text: e.target.value } : null
                  )
                }
                className="min-h-[120px] resize-y"
                placeholder="Primary ad copy text..."
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={selectedCard?.notes || ""}
                onChange={(e) =>
                  setSelectedCard((prev) =>
                    prev ? { ...prev, notes: e.target.value } : null
                  )
                }
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (selectedCard) {
                    handleDeleteClick(selectedCard.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Card
              </Button>
              
              {selectedCard?.status === CARD_STATUS.READY_TO_LAUNCH && (
                <Button onClick={() => setLaunchDialogOpen(true)}>
                  <Rocket className="w-4 h-4 mr-2" />
                  Launch Campaign
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => handleDialogClose(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedCard && updateCardMutation.mutate(selectedCard)}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning */}
      <AlertDialog open={unsavedWarningOpen} onOpenChange={setUnsavedWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscardChanges}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this card? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Launch Campaign Dialog */}
      <Dialog open={launchDialogOpen} onOpenChange={setLaunchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Launch Campaign</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Black Friday - Image Ad 1"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Daily Budget ($)</Label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Targeting Preset</Label>
              <Select value={targeting} onValueChange={setTargeting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="broad">Broad Audience</SelectItem>
                  <SelectItem value="lookalike">Lookalike Audience</SelectItem>
                  <SelectItem value="retargeting">Retargeting</SelectItem>
                  <SelectItem value="custom">Custom Audience</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLaunchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLaunch}>
              <Rocket className="w-4 h-4 mr-2" />
              Launch on Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
