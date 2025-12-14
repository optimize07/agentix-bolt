interface ActivityFeedItemProps {
  action: string;
  client: string;
  time: string;
}

export const ActivityFeedItem = ({ action, client, time }: ActivityFeedItemProps) => {
  return (
    <div className="p-4 hover:bg-sidebar/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-primary">{client.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground mb-1">{action}</p>
          <p className="text-xs text-muted-foreground">{client}</p>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
      </div>
    </div>
  );
};
