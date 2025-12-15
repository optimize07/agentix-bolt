import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Helmet } from "react-helmet";

const DEV_TEST_USER = {
  email: "dev@test.com",
  password: "devpassword123",
  fullName: "Dev Test User"
};

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const autoLoginInDevMode = async () => {
      if (!import.meta.env.DEV) return;

      try {
        // Try to sign in with dev credentials
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: DEV_TEST_USER.email,
          password: DEV_TEST_USER.password,
        });

        let userId = signInData?.user?.id;

        if (signInError) {
          // If user doesn't exist, create it
          if (signInError.message.includes("Invalid login credentials")) {
            const redirectUrl = `${window.location.origin}/`;
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: DEV_TEST_USER.email,
              password: DEV_TEST_USER.password,
              options: {
                emailRedirectTo: redirectUrl,
                data: {
                  full_name: DEV_TEST_USER.fullName,
                },
              },
            });

            if (signUpError) {
              console.error("Failed to create dev user:", signUpError);
              return;
            }

            userId = signUpData?.user?.id;

            // Sign in after creating account
            await supabase.auth.signInWithPassword({
              email: DEV_TEST_USER.email,
              password: DEV_TEST_USER.password,
            });
          }
        }

        // Check if user has an organization using security definer function
        if (userId) {
          const { data: orgId } = await supabase.rpc('get_user_organization_id', {
            _user_id: userId
          });

          // Always create organization for users without one (not just in dev mode)
          if (!orgId) {
            // Get first available niche
            const { data: niche } = await supabase
              .from('niches')
              .select('id')
              .limit(1)
              .single();

            if (niche) {
              // Create test organization
              const { data: org } = await supabase
                .from('organizations')
                .insert({
                  name: 'Test Organization',
                  niche_id: niche.id,
                  settings: {}
                })
                .select()
                .single();

              if (org) {
                // Link profile to org
                await supabase
                  .from('profiles')
                  .update({ organization_id: org.id })
                  .eq('id', userId);

                // Get owner role
                const { data: ownerRole } = await supabase
                  .from('niche_roles')
                  .select('id')
                  .eq('slug', 'owner')
                  .single();

                if (ownerRole) {
                  // Assign owner role
                  await supabase
                    .from('user_roles')
                    .insert({
                      user_id: userId,
                      organization_id: org.id,
                      role_id: ownerRole.id
                    });
                }

                console.log('Organization setup complete for user');
              }
            }
          }
        }

        toast.success(`🚀 Dev mode: Auto-logged in as ${DEV_TEST_USER.email}`);
      } catch (error) {
        console.error("Dev auto-login failed:", error);
      }
    };

    autoLoginInDevMode();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      toast.success("Account created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In | DataViz Pro</title>
        <meta name="description" content="Sign in to DataViz Pro to access your sales dashboard" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to DataViz Pro</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Auth;
