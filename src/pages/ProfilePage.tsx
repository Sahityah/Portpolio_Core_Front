import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Camera, Key, Save } from "lucide-react";

type UserData = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
};

const ProfilePage = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  
  // Load user data
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Initialize form with user data
      setFormData(prev => ({
        ...prev,
        name: parsedUser.name || "",
        email: parsedUser.email || "",
        phone: parsedUser.phone || "",
        address: parsedUser.address || "",
        city: parsedUser.city || "",
        state: parsedUser.state || "",
        zip: parsedUser.zip || "",
      }));
    } catch (error) {
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Update user data in local storage
      if (user) {
        const updatedUser = {
          ...user,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        };
        
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully.",
        });
      }
      
      setIsLoading(false);
    }, 1000);
  };
  
  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (formData.newPassword !== formData.confirmNewPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation do not match",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      }));
      
      setIsLoading(false);
    }, 1000);
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Show loading state if user data is not loaded
  if (!user) {
    return <DashboardLayout>
      <div className="container mx-auto py-12 flex justify-center">
        <div className="animate-pulse">Loading profile...</div>
      </div>
    </DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">User Profile</h1>
        
        <div className="flex flex-col md:flex-row gap-6 md:items-start">
          {/* Profile picture section */}
          <Card className="md:w-64 w-full">
            <CardHeader>
              <CardTitle className="text-center">Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage 
                    src={user.avatar || ""}
                    alt={user.name} 
                  />
                  <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center">
                <h3 className="font-medium">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Profile details tabs */}
          <div className="flex-1">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Personal Info</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <span>Security</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zip">ZIP / Postal</Label>
                          <Input
                            id="zip"
                            name="zip"
                            value={formData.zip}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading} className="flex gap-2 items-center">
                          {isLoading ? (
                            <>
                              <div className="h-4 w-4 border-2 border-r-transparent rounded-full animate-spin"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Update your password or security preferences.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={formData.currentPassword}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={formData.newPassword}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                        <Input
                          id="confirmNewPassword"
                          name="confirmNewPassword"
                          type="password"
                          value={formData.confirmNewPassword}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading} className="flex gap-2 items-center">
                          {isLoading ? (
                            <>
                              <div className="h-4 w-4 border-2 border-r-transparent rounded-full animate-spin"></div>
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <Key className="h-4 w-4" />
                              <span>Update Password</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;