// src/pages/LoginPage.tsx

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";
// Removed: import { GoogleLogin } from "@react-oauth/google"; // No longer using client-side Google component
import { AxiosError } from 'axios'; // Import AxiosError for more specific error handling

// Import the actual useAuthStore from its dedicated file (the Canvas document)
import useAuthStore from "@/store/useAuthStore"; // Assuming this path based on typical project structure

// Regular expressions for validation
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MIN_PASSWORD_LENGTH = 8; // Consistent with RegisterPage's strong password validation


const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login, isAuthenticated, setAuthenticated, setToken } = useAuthStore(); // Added setAuthenticated, setToken for URL parsing
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Login - Portfolio Manager";

    // Check for a JWT token in the URL after Google OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    const errorFromUrl = urlParams.get('error');

    if (tokenFromUrl) {
      console.log("JWT token found in URL:", tokenFromUrl);
      // Assuming useAuthStore has actions to set the token and authentication status
      setToken(tokenFromUrl);
      setAuthenticated(true);

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      // Clean the URL by removing the token parameter for security and aesthetics
      // and then navigate to the dashboard
      navigate("/dashboard", { replace: true });
    } else if (errorFromUrl) {
      console.error("Error from OAuth callback:", errorFromUrl);
      toast({
        title: "Authentication Failed",
        description: `Error: ${decodeURIComponent(errorFromUrl)}`,
        variant: "destructive",
      });
      // Clean the URL by removing the error parameter
      navigate("/login", { replace: true });
    }
  }, [navigate, setAuthenticated, setToken, toast]); // Added setAuthenticated, setToken to deps

  // --- CORRECTED NAVIGATION LOGIC ---
  useEffect(() => {
    if (isAuthenticated) {
      // If user is authenticated, navigate to dashboard.
      // Use replace to prevent going back to login page with back button.
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);


  const validate = useCallback(() => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < MIN_PASSWORD_LENGTH) {
      newErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific error message as user types
    if (errors[name as keyof typeof errors]) { // Type assertion for errors[name]
      setErrors((prev) => ({ ...prev, [name as keyof typeof errors]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return; // Run full validation on submit

    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      toast({
        title: "Login successful",
        description: "Welcome back to your portfolio dashboard",
      });
      // Navigation is now handled by the useEffect based on isAuthenticated
    } catch (error) {
      let description = "An unexpected error occurred during login.";
      if (error instanceof AxiosError) {
        if (error.response?.data?.message) {
          description = error.response.data.message;
        } else if (error.response?.status === 401) {
          description = "Invalid email or password.";
        }
      } else if (error instanceof Error) {
        description = error.message; // Fallback for generic JS errors
      }

      toast({
        title: "Login failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Renamed and modified from handleGoogleSuccess
  const handleGoogleLoginRedirect = () => {
    setIsLoading(true); // Indicate loading as we're initiating a redirect
    // IMPORTANT CHANGE: Redirect to your backend's Spring Security OAuth2 authorization endpoint
    const backendBaseUrl = 'https://personal-portfolio-29nl.onrender.com'; // Replace with your actual backend base URL
    window.location.href = `${backendBaseUrl}/oauth2/authorization/google`;

    // Note: The execution of JavaScript on this page stops after window.location.href,
    // as the browser navigates away. The authentication flow continues on your backend.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Access your portfolio dashboard
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Replaced GoogleLogin component with a regular button that triggers redirect */}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:-translate-y-0.5 flex items-center justify-center"
              onClick={handleGoogleLoginRedirect}
              disabled={isLoading} // Disable while any login process is ongoing
            >
              {isLoading ? ( // Show spinner only if isLoading is true AND it's for Google login
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 border-2 border-r-transparent border-white rounded-full animate-spin" />
                  <span>Redirecting to Google...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.75 1.22 9.24 3.23l6.53-6.53C34.62 3.82 29.38 1.5 24 1.5 15.5 1.5 8.24 6.94 4.5 14.5l6.51 5.02C12.16 13.91 17.5 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.7 24.5c0-1.57-.15-3.09-.43-4.59H24v8.58h12.43c-.77 4.09-3.08 7.45-6.19 9.68l6.19 4.79c3.67-3.4 6.13-8.52 6.13-14.71z"></path>
                    <path fill="#FBBC04" d="M12.16 32.74c-.67-2.09-1.07-4.39-1.07-6.74s.4-4.65 1.07-6.74l-6.51-5.02C4.3 18.06 1.5 20.81 1.5 24.5s2.8 6.44 6.09 9.92l6.57-5.04z"></path>
                    <path fill="#34A853" d="M24 47.5c6.54 0 12.06-2.14 16.08-5.83l-6.19-4.79c-2.92 1.93-6.69 3.12-9.89 3.12-6.5 0-11.84-4.41-14.5-10.91l-6.57 5.04c3.76 7.57 11.02 13.01 19.57 13.01z"></path>
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or continue with email
                </span>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  autoFocus
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 border-2 border-r-transparent border-white rounded-full animate-spin" />
                    <span>Logging in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </div>
                )}
              </Button>
            </form>
          </div>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don’t have an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
