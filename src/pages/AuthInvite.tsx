import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  getInvitationByToken,
  acceptInvitation,
  type InvitationDetails,
} from "@/integrations/invitations/api";
import {
  Loader2,
  Rocket,
  Building2,
  Mail,
  AlertCircle,
  CheckCircle2,
  UserPlus,
} from "lucide-react";

type PageState = "loading" | "invalid" | "signup" | "signin" | "accepting" | "success" | "error";

const AuthInvite = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [pageState, setPageState] = useState<PageState>("loading");
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for existing session
  const [existingUser, setExistingUser] = useState(false);

  useEffect(() => {
    if (!token) {
      setPageState("invalid");
      setErrorMessage("No invitation token provided");
      return;
    }

    loadInvitation();
    checkExistingSession();
  }, [token]);

  async function checkExistingSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setExistingUser(true);
      setEmail(session.user.email || "");
    }
  }

  async function loadInvitation() {
    if (!token) return;

    try {
      const data = await getInvitationByToken(token);

      if (!data) {
        setPageState("invalid");
        setErrorMessage("This invitation link is invalid or has been used.");
        return;
      }

      setInvitation(data);
      setEmail(data.email);

      if (!data.is_valid) {
        if (data.status === "accepted") {
          setPageState("invalid");
          setErrorMessage("This invitation has already been accepted.");
        } else if (data.status === "expired") {
          setPageState("invalid");
          setErrorMessage("This invitation has expired. Please request a new one.");
        } else if (data.status === "revoked") {
          setPageState("invalid");
          setErrorMessage("This invitation has been revoked.");
        } else {
          setPageState("invalid");
          setErrorMessage("This invitation is no longer valid.");
        }
        return;
      }

      // Check if user already has an account
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // User is logged in
        if (session.user.email?.toLowerCase() === data.email.toLowerCase()) {
          // Same email - can accept directly
          setPageState("signin");
          setExistingUser(true);
        } else {
          // Different email - need to sign out first
          setPageState("signin");
          setExistingUser(false);
        }
      } else {
        // No session - show signup form
        setPageState("signup");
      }
    } catch (error) {
      console.error("Failed to load invitation:", error);
      setPageState("error");
      setErrorMessage("Failed to load invitation details. Please try again.");
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation?.email || email,
        password,
        options: {
          data: {
            display_name: displayName || email.split("@")[0],
            invitation_token: token,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // Accept the invitation
      setPageState("accepting");
      const result = await acceptInvitation(token!);

      if (result.success) {
        setPageState("success");
        toast({
          title: "Welcome!",
          description: "Your account has been created and you've joined the team.",
        });

        // Redirect to client dashboard after a brief delay
        setTimeout(() => {
          navigate(`/client/${invitation?.client_slug}`);
        }, 2000);
      } else {
        throw new Error(result.error || "Failed to accept invitation");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setPageState("signup");
      toast({
        title: "Sign up failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Sign in the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: invitation?.email || email,
        password,
      });

      if (authError) throw authError;

      // Accept the invitation
      setPageState("accepting");
      const result = await acceptInvitation(token!);

      if (result.success) {
        setPageState("success");
        toast({
          title: "Welcome back!",
          description: "You've been added to the team.",
        });

        // Redirect to client dashboard
        setTimeout(() => {
          navigate(`/client/${invitation?.client_slug}`);
        }, 2000);
      } else {
        throw new Error(result.error || "Failed to accept invitation");
      }
    } catch (error: any) {
      console.error("Signin error:", error);
      setPageState("signin");
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAcceptWithExistingSession() {
    setIsSubmitting(true);
    setPageState("accepting");

    try {
      const result = await acceptInvitation(token!);

      if (result.success) {
        setPageState("success");
        toast({
          title: "Invitation Accepted",
          description: "You've been added to the team.",
        });

        // Redirect to client dashboard
        setTimeout(() => {
          navigate(`/client/${invitation?.client_slug}`);
        }, 2000);
      } else {
        throw new Error(result.error || "Failed to accept invitation");
      }
    } catch (error: any) {
      console.error("Accept error:", error);
      setPageState("signin");
      toast({
        title: "Failed to accept",
        description: error.message || "Could not accept invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Render loading state
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Render invalid/error state
  if (pageState === "invalid" || pageState === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20 mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">Invalid Invitation</h1>
          <p className="text-muted-foreground mb-6">{errorMessage}</p>
          <Button onClick={() => navigate("/auth")} variant="outline">
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  // Render accepting state
  if (pageState === "accepting") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Joining the team...</p>
        </div>
      </div>
    );
  }

  // Render success state
  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold mb-2">Welcome to {invitation?.client_name}!</h1>
          <p className="text-muted-foreground mb-4">
            You've successfully joined the team. Redirecting to your dashboard...
          </p>
          <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
        </Card>
      </div>
    );
  }

  // Render signup/signin form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/20">
            <Rocket className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold">Agentix</h1>
            <p className="text-muted-foreground mt-2">Accept your invitation</p>
          </div>
        </div>

        {/* Invitation Details */}
        <Card className="p-6 bg-muted/50">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">{invitation?.client_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs capitalize">
                  {invitation?.role}
                </Badge>
              </div>
              {invitation?.message && (
                <p className="text-sm text-muted-foreground mt-3 italic">
                  "{invitation.message}"
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Form Card */}
        <Card className="p-6">
          {existingUser && pageState === "signin" ? (
            // Existing user - just confirm
            <div className="space-y-4">
              <div className="text-center">
                <UserPlus className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold">Accept Invitation</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You're signed in as <strong>{email}</strong>
                </p>
              </div>
              <Button
                onClick={handleAcceptWithExistingSession}
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Team"
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await supabase.auth.signOut();
                  setExistingUser(false);
                  setPageState("signup");
                }}
              >
                Use a different account
              </Button>
            </div>
          ) : pageState === "signin" ? (
            // Sign in form
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="font-semibold">Sign In to Accept</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your password to join the team
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{invitation?.email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In & Join"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setPageState("signup")}
              >
                Don't have an account? Sign up
              </Button>
            </form>
          ) : (
            // Sign up form
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="font-semibold">Create Your Account</h3>
                <p className="text-sm text-muted-foreground">
                  Set up your account to join {invitation?.client_name}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{invitation?.email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account & Join"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setPageState("signin")}
              >
                Already have an account? Sign in
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AuthInvite;

