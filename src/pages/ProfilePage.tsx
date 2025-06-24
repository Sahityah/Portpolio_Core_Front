import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast"; // Adjusted to absolute path
import { Button } from "@/components/ui/button"; // Adjusted to absolute path
import { Input } from "@/components/ui/input"; // Adjusted to absolute path
import { Label } from "@/components/ui/label"; // Adjusted to absolute path
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // Adjusted to absolute path
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Adjusted to absolute path
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Adjusted to absolute path
import { User, Camera, Key, Save } from "lucide-react";
import { AxiosResponse } from 'axios';

// Define the UserData type - ensure this matches your Spring backend's DTO/Entity
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

// --- Define local interfaces for userApi methods ---
// This helps TypeScript understand the methods available on 'userApi'
// if the original declaration in your project's lib/api.ts is incomplete or generic.
interface IUserApi {
  getProfile: () => Promise<AxiosResponse<UserData>>;
  updateProfile: (data: Partial<UserData>) => Promise<AxiosResponse<UserData>>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<AxiosResponse<{ message: string }>>;
}

// Import the actual userApi from your lib/api and cast it to the custom interface
// This provides stronger type checking for calls within this component.
import { userApi as originalUserApi } from "@/lib/api"; // Adjusted to absolute path
const userApi: IUserApi = originalUserApi as IUserApi;


const ProfilePage = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For form submission loading state
  const [isFetchingUser, setIsFetchingUser] = useState(true); // For initial user profile fetch loading state
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "", // Email might not be editable directly through this form
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // Load user data from backend
  const loadUserData = useCallback(async () => {
    setIsFetchingUser(true);
    try {
      // Use userApi.getProfile to fetch user data
      const response = await userApi.getProfile();
      const fetchedUser = response.data;
      setUser(fetchedUser);

      // Initialize form with fetched user data
      setFormData(prev => ({
        ...prev,
        name: fetchedUser.name || "",
        email: fetchedUser.email || "", // Populate email for display, even if not editable
        phone: fetchedUser.phone || "",
        address: fetchedUser.address || "",
        city: fetchedUser.city || "",
        state: fetchedUser.state || "",
        zip: fetchedUser.zip || "",
      }));
    } catch (error: any) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error loading profile",
        description: error.response?.data?.message || "Failed to retrieve your profile. Please try again or log in.",
        variant: "destructive",
      });
      // Redirect to login if there's an authentication error or general failure to load profile
      navigate("/login");
    } finally {
      setIsFetchingUser(false);
    }
  }, [navigate, toast]); // Dependencies: navigate and toast hooks

  useEffect(() => {
    // No need for a client-side authToken check here; rely on `userApi`'s interceptors
    // and the `navigate("/login")` in `loadUserData` for authentication failures.
    loadUserData();
  }, [loadUserData]); // Dependency: loadUserData callback

  // Handler for all input changes in the form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler for submitting profile updates
  const handleProfileUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Only send fields that are intended to be updated via this form
      const updatedProfileData: Partial<UserData> = {
        name: formData.name,
        // email: formData.email, // Typically email is not updated via profile form for security reasons
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
      };

      // Use userApi.updateProfile to send data to backend
      const response = await userApi.updateProfile(updatedProfileData);
      const result = response.data; // The backend should return the updated user data

      setUser(result); // Update local user state with the data from backend

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: error.response?.data?.message || "There was an issue updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, toast]); // Dependencies: formData state and toast hook

  // Handler for submitting password changes
  const handlePasswordUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation for passwords
    if (formData.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use userApi.changePassword to send password data to backend
      const response = await userApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      const result = response.data; // Expecting { message: string }

      toast({
        title: "Password updated",
        description: result.message || "Your password has been changed successfully.",
      });

      // Reset password fields after successful update
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        cNewPassword: "", // Corrected: This should match the state property name
        confirmNewPassword: "",
      }));
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Password update failed",
        description: error.response?.data?.message || "There was an issue changing your password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, toast]); // Dependencies: formData state and toast hook

  // Helper function to get initials for avatar fallback
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Show loading state for initial user fetch
  if (isFetchingUser) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center h-screen-minus-header">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-t-4 border-blue-500 rounded-full animate-spin"></div>
          <div className="text-lg font-medium text-muted-foreground">Loading profile...</div>
        </div>
      </div>
    );
  }

  // If fetching is complete but no user data is present (e.g., API error or no auth)
  if (!user) {
    return (
      <div className="container mx-auto py-12 flex flex-col justify-center items-center h-screen-minus-header text-center">
        <div className="text-lg font-medium text-red-500 mb-4">
          Could not load user profile. Please try logging in again.
        </div>
        <Button onClick={() => navigate("/login")} className="bg-blue-600 hover:bg-blue-700 text-white">Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 font-inter">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">User Profile</h1>

      <div className="flex flex-col md:flex-row gap-6 md:items-start">
        {/* Profile picture section */}
        <Card className="md:w-64 w-full border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl text-gray-800 dark:text-gray-200">Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4 pb-6">
            <div className="relative">
              <Avatar className="w-32 h-32 border-2 border-blue-500 shadow-md">
                <AvatarImage
                  src={user.avatar || "https://placehold.co/128x128/cccccc/ffffff?text=U"} // Placeholder for no avatar
                  alt={user.name || "User"}
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/128x128/cccccc/ffffff?text=${getInitials(user.name)}`; }}
                />
                <AvatarFallback className="text-4xl font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Change profile picture"
              >
                <Camera className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </Button>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Profile details tabs */}
        <div className="flex-1">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm">
              <TabsTrigger value="personal" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md transition-colors">
                <User className="h-4 w-4" />
                <span>Personal Info</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md transition-colors">
                <Key className="h-4 w-4" />
                <span>Security</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800 dark:text-gray-200">Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="rounded-md shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          disabled // Email is usually not directly editable
                          className="rounded-md shadow-sm bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          className="rounded-md shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-gray-700 dark:text-gray-300">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="rounded-md shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-gray-700 dark:text-gray-300">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="rounded-md shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-gray-700 dark:text-gray-300">State</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className="rounded-md shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip" className="text-gray-700 dark:text-gray-300">ZIP / Postal</Label>
                        <Input
                          id="zip"
                          name="zip"
                          value={formData.zip}
                          onChange={handleChange}
                          className="rounded-md shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isLoading} className="flex gap-2 items-center bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md transition-all duration-200 ease-in-out">
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
              <Card className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800 dark:text-gray-200">Security Settings</CardTitle>
                  <CardDescription>
                    Update your password or security preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-gray-700 dark:text-gray-300">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        required
                        className="rounded-md shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        required
                        className="rounded-md shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword" className="text-gray-700 dark:text-gray-300">Confirm New Password</Label>
                      <Input
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        type="password"
                        value={formData.confirmNewPassword}
                        onChange={handleChange}
                        required
                        className="rounded-md shadow-sm"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isLoading} className="flex gap-2 items-center bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md transition-all duration-200 ease-in-out">
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
  );
};

export default ProfilePage;
