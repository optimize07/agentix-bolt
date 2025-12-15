import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GlossaryCustomization } from "@/components/settings/GlossaryCustomization";
import { UsersManagement } from "@/components/settings/UsersManagement";
import { ProductsCatalog } from "@/components/settings/ProductsCatalog";
import { IntegrationsManager } from "@/components/settings/IntegrationsManager";
import { OrganizationSettings } from "@/components/settings/OrganizationSettings";
import { FormsSettings } from "@/components/settings/FormsSettings";
import { ThemesSettings } from "@/components/settings/ThemesSettings";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { PermissionGate } from "@/components/PermissionGate";
import { AppLayout } from "@/components/AppLayout";

import { Users, Package, Palette, Plug, Building2, FileText, Brush, Sun, Moon, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getLabel } = useOrganization();
  const { mode, setMode } = useTheme();
  const activeTab = searchParams.get("tab") || "organization";

  useEffect(() => {
    // In development, skip auth redirects so settings is accessible without login
    if (import.meta.env.DEV) {
      return;
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Settings | DataViz Pro</title>
        <meta name="description" content="Manage your organization settings, users, products, and integrations" />
      </Helmet>
      
      <AppLayout>
        <div className="p-6 space-y-6">
          <div 
            className="flex items-center justify-between py-4"
            style={{ borderBottom: `var(--divider-width) var(--divider-style) var(--divider-color)` }}
          >
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your organization settings, users, products, and integrations</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  {mode === 'dark' ? <Moon size={20} /> : mode === 'light' ? <Sun size={20} /> : <Monitor size={20} />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover z-50">
                <DropdownMenuItem onClick={() => setMode('light')}>
                  <Sun className="mr-2" size={16} /> Light Mode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMode('dark')}>
                  <Moon className="mr-2" size={16} /> Dark Mode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMode('system')}>
                  <Monitor className="mr-2" size={16} /> System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => navigate(`/settings?tab=${value}`)} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="organization" className="gap-2">
                <Building2 size={16} />
                Organization
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users size={16} />
                Users
              </TabsTrigger>
              <TabsTrigger value="forms" className="gap-2">
                <FileText size={16} />
                Forms
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-2">
                <Package size={16} />
                Products
              </TabsTrigger>
              <TabsTrigger value="customization" className="gap-2">
                <Palette size={16} />
                Customization
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-2">
                <Plug size={16} />
                Integrations
              </TabsTrigger>
              <TabsTrigger value="themes" className="gap-2">
                <Brush size={16} />
                Themes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="organization" className="mt-6">
              <OrganizationSettings />
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <PermissionGate 
                required="users.manage"
                fallback={
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-muted-foreground">
                        You don't have permission to manage users
                      </p>
                    </CardContent>
                  </Card>
                }
              >
                <UsersManagement />
              </PermissionGate>
            </TabsContent>

            <TabsContent value="forms" className="mt-6">
              <FormsSettings />
            </TabsContent>

            <TabsContent value="products" className="mt-6">
              <ProductsCatalog />
            </TabsContent>

            <TabsContent value="customization" className="mt-6">
              <GlossaryCustomization />
            </TabsContent>

            <TabsContent value="integrations" className="mt-6">
              <IntegrationsManager />
            </TabsContent>

            <TabsContent value="themes" className="mt-6">
              <ThemesSettings />
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </>
  );
};

export default Settings;
