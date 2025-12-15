import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, MapPin, UserCog, CheckCircle2 } from "lucide-react";

interface Niche {
  id: string;
  name: string;
  slug: string;
  organizational_type: string;
}

interface Role {
  id: string;
  name: string;
  slug: string;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Step 1: Organization
  const [organizationName, setOrganizationName] = useState("");
  
  // Step 2: Niche
  const [niches, setNiches] = useState<Niche[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<string>("");
  
  // Step 3: Role
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  
  // Step 4: Profile
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);

      // Check if user already has an organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profile?.organization_id) {
        navigate("/");
      }
    };

    checkUser();
  }, [navigate]);

  useEffect(() => {
    // Fetch all niches
    const fetchNiches = async () => {
      const { data, error } = await supabase
        .from("niches")
        .select("*")
        .order("name");

      if (data && !error) {
        setNiches(data);
      }
    };

    fetchNiches();
  }, []);

  useEffect(() => {
    // Fetch roles when niche is selected
    if (selectedNiche) {
      const fetchRoles = async () => {
        const { data, error } = await supabase
          .from("niche_roles")
          .select("*")
          .eq("niche_id", selectedNiche)
          .order("name");

        if (data && !error) {
          setRoles(data);
        }
      };

      fetchRoles();
    }
  }, [selectedNiche]);

  const handleStepOne = () => {
    if (!organizationName.trim()) {
      toast.error("Please enter an organization name");
      return;
    }
    setStep(2);
  };

  const handleStepTwo = () => {
    if (!selectedNiche) {
      toast.error("Please select a niche");
      return;
    }
    setStep(3);
  };

  const handleStepThree = () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }
    setStep(4);
  };

  const handleComplete = async () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!userId) {
      toast.error("User not found");
      return;
    }

    setLoading(true);

    try {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: organizationName,
          niche_id: selectedNiche,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Update or create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email: (await supabase.auth.getUser()).data.user?.email || "",
          full_name: fullName,
          organization_id: org.id,
        });

      if (profileError) throw profileError;

      // Assign role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          organization_id: org.id,
          role_id: selectedRole,
        });

      if (roleError) throw roleError;

      toast.success("Welcome to DataViz Pro!");
      navigate("/");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <Building2 className="text-primary" size={24} />
                </div>
                <div>
                  <CardTitle>Create Your Organization</CardTitle>
                  <CardDescription>Let's start by setting up your organization</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  placeholder="e.g., Acme Dental Practice"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  autoFocus
                />
              </div>
              <Button onClick={handleStepOne} className="w-full">
                Continue
              </Button>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <MapPin className="text-primary" size={24} />
                </div>
                <div>
                  <CardTitle>Select Your Industry</CardTitle>
                  <CardDescription>Choose the industry that best describes your organization</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="niche">Industry Type</Label>
                <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                  <SelectTrigger id="niche">
                    <SelectValue placeholder="Select an industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {niches.map((niche) => (
                      <SelectItem key={niche.id} value={niche.id}>
                        {niche.name} ({niche.organizational_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                  Back
                </Button>
                <Button onClick={handleStepTwo} className="w-full">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <UserCog className="text-primary" size={24} />
                </div>
                <div>
                  <CardTitle>Choose Your Role</CardTitle>
                  <CardDescription>Select the role that best matches your position</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="w-full">
                  Back
                </Button>
                <Button onClick={handleStepThree} className="w-full">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="text-primary" size={24} />
                </div>
                <div>
                  <CardTitle>Complete Your Profile</CardTitle>
                  <CardDescription>Tell us a bit about yourself</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  placeholder="e.g., John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="w-full" disabled={loading}>
                  Back
                </Button>
                <Button onClick={handleComplete} className="w-full" disabled={loading}>
                  {loading ? "Setting up..." : "Complete Setup"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>Welcome | DataViz Pro</title>
        <meta name="description" content="Set up your organization and get started with DataViz Pro" />
      </Helmet>
      
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    s <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Step {step} of 4
            </p>
          </div>

          {renderStep()}
        </div>
      </div>
    </>
  );
};

export default Onboarding;
