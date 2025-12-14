import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import AdSpyCreativeCard from "./AdSpyCreativeCard";

const AdSpyCreativeBoard = () => {
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: searchesData, error: searchesError } = await supabase
        .from('ad_spy_searches')
        .select('id')
        .eq('user_id', user.id);

      if (searchesError) throw searchesError;

      const searchIds = searchesData.map(s => s.id);

      if (searchIds.length === 0) {
        setAds([]);
        setIsLoading(false);
        return;
      }

      const { data: adsData, error: adsError } = await supabase
        .from('ad_spy_ads')
        .select(`
          *,
          ad_spy_analysis (*)
        `)
        .in('search_id', searchIds)
        .order('created_at', { ascending: false });

      if (adsError) throw adsError;

      setAds(adsData || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-12 flex items-center justify-center bg-card border-border">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (ads.length === 0) {
    return (
      <Card className="p-12 text-center bg-card border-border">
        <p className="text-muted-foreground">
          No ads saved yet. Search for ads to start building your creative library.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ads.map((ad) => (
        <AdSpyCreativeCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
};

export default AdSpyCreativeBoard;
