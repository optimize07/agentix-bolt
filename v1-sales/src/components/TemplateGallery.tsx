import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { dashboardTemplates } from "@/templates/dashboardTemplates";
import { LayoutGrid, TrendingUp, DollarSign, BarChart3, ShoppingCart } from "lucide-react";

interface TemplateGalleryProps {
  onSelectTemplate: (templateId: string) => void;
}

const categoryIcons = {
  blank: LayoutGrid,
  sales: TrendingUp,
  finance: DollarSign,
  analytics: BarChart3,
  ecommerce: ShoppingCart,
};

const TemplateGallery = ({ onSelectTemplate }: TemplateGalleryProps) => {
  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Choose a Template</h2>
        <p className="text-muted-foreground">Start with a pre-built dashboard or create your own from scratch</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboardTemplates.map((template) => {
          const Icon = categoryIcons[template.category];
          return (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:border-primary transition-all"
              onClick={() => onSelectTemplate(template.id)}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-2">
                  <Icon className="text-primary" size={24} />
                </div>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Use Template
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateGallery;
