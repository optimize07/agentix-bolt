interface RevenueTimelineCardProps {
  period: string;
  revenue: string;
  leads: string;
  conversions: string;
  aov: string;
}

export const RevenueTimelineCard = ({ period, revenue, leads, conversions, aov }: RevenueTimelineCardProps) => {
  return (
    <div 
      className="rounded-lg p-6"
      style={{
        background: 'var(--card-bg)',
        border: 'var(--card-border-width) solid var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold text-foreground">{period}</h3>
        <p className="text-xl font-bold text-primary">{revenue}</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Leads</p>
          <p className="text-sm font-semibold text-foreground">{leads}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Conv</p>
          <p className="text-sm font-semibold text-foreground">{conversions}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">AOV</p>
          <p className="text-sm font-semibold text-foreground">{aov}</p>
        </div>
      </div>
    </div>
  );
};
