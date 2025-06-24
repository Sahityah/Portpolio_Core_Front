import { useState, useEffect, useRef } from "react";
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
import { useAuthStore } from "@/store/auth-store";
import { GoogleLogin } from "@react-oauth/google";
// import { debounce } from "lodash"; // We can simplify without explicit debounce for this use case

import { AxiosError } from 'axios'; // Import AxiosError for more specific error handling

// Enhanced Email Regex: More robust for common email formats
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// For login, password minimum length should align with what the backend accepts,
// typically matching the registration minimum. If registration is 8+, make this 8+.
const MIN_PASSWORD_LENGTH = 8; // Consistent with RegisterPage's strong password validation


const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  // const [showGoogleLogin, setShowGoogleLogin] = useState(true); // Retaining, but if always true, can be removed

  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const navigate = useNavigate();
  const { toast } = useToast();
  const hasNavigated = useRef(false);

  useEffect(() => {
    document.title = "Login - Portfolio Manager";
  }, []);

  useEffect(() => {
    // Only navigate if isAuthenticated becomes true AND we haven't navigated yet
    if (isAuthenticated && !hasNavigated.current) {
      hasNavigated.current = true; // Set ref to true to prevent future navigations
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]); // Depend on isAuthenticated and navigate

  // Removed debounced validation for simplicity in handleChange,
  // relying on `validate` for final submission check.
  // Real-time validation can be done directly if simple enough, or through a custom hook.

  const validate = () => {
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
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific error message as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
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
      // Navigation is handled by the useEffect based on isAuthenticated
    } catch (error) {
      // Enhancement: More specific error messages from backend
      let description = "Invalid credentials. Please try again.";
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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true); // Set loading state for Google login as well
    if (!credentialResponse.credential) {
      toast({
        title: "Google login failed",
        description: "No credential received from Google.",
        variant: "destructive",
      });
      setIsLoading(false); // Reset loading state
      return;
    }
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast({
        title: "Google login successful",
        description: "Welcome!",
      });
      // Navigation is handled by the useEffect based on isAuthenticated
    } catch (error) {
      // Enhancement: More specific error messages from backend
      let description = "Problem authenticating with Google. Please try again.";
      if (error instanceof AxiosError && error.response?.data?.message) {
        description = error.response.data.message;
      } else if (error instanceof Error) {
        description = error.message;
      }
      toast({
        title: "Google login failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Reset loading state
    }
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
            {/* showGoogleLogin check is currently redundant if always true, consider removing or adding logic */}
            <div className={isLoading ? "pointer-events-none opacity-60" : ""}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  toast({
                    title: "Google login failed",
                    description: "Please try again.",
                    variant: "destructive",
                  })
                }
                useOneTap
                shape="rectangular"
                theme="outline"
                locale="en"
                size="large"
                width="320"
              />
            </div>

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
              onKeyDown={(e) => isLoading && e.key === "Enter" && e.preventDefault()}
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
                  autoFocus // Enhancement: Auto-focus on first input
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
                    aria-invalid={!!errors.password} // Enhancement: Add aria-invalid
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"} // Enhancement: Add aria-label
                    aria-pressed={showPassword} // Enhancement: Add aria-pressed
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