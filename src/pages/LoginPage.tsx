import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { GoogleLogin } from "@react-oauth/google";
import { AxiosError } from 'axios'; // Import AxiosError for more specific error handling

// Type definition for a user, potentially from a shared types file
type User = {
  id: string;
  name: string;
  email: string;
  token: string; // Authentication token
  avatar?: string | null;
};

// ===============================================
// Mock Authentication Store (useAuthStore)
// This simulates your global authentication state management.
// In a real application, this would be a separate file (e.g., src/store/auth-store.ts)
// using libraries like Zustand, Redux, or React Context.
// ===============================================

// Mock user data for successful login
const MOCK_USER: User = {
  id: "mockuser123",
  name: "Mock User",
  email: "test@example.com",
  token: "mock-jwt-token-for-test-user",
  avatar: "[https://github.com/shadcn.png](https://github.com/shadcn.png)",
};

// Mock user data for Google login
const MOCK_GOOGLE_USER: User = {
  id: "mockgoogleuser456",
  name: "Google User",
  email: "google@example.com",
  token: "mock-google-jwt-token",
  avatar: "[https://lh3.googleusercontent.com/a/AGNmyxZq_12345=s96-c](https://lh3.googleusercontent.com/a/AGNmyxZq_12345=s96-c)",
};

// A simple mock auth store using React's useState and useContext-like pattern
// For a real app, use a dedicated state management library.
const useAuthStore = (() => {
  let _user: User | null = null;
  let _isAuthenticated: boolean = false;
  let _listeners: Set<() => void> = new Set();

  const getSnapshot = () => ({
    user: _user,
    isAuthenticated: _isAuthenticated,
  });

  const subscribe = (listener: () => void): (() => void) => { // Explicitly type the return as void
    _listeners.add(listener);
    return () => { _listeners.delete(listener); }; // Wrap in a function that returns void
  };

  const publish = () => {
    _listeners.forEach(listener => listener());
  };

  const setUserState = (user: User | null) => {
    _user = user;
    _isAuthenticated = !!user;
    if (user) {
      localStorage.setItem("authToken", user.token);
      localStorage.setItem("user", JSON.stringify(user)); // Store user data for persistence
    } else {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    }
    publish();
  };

  const login = async (email: string, password: string): Promise<void> => {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === MOCK_USER.email && password === "password123") {
          setUserState(MOCK_USER);
          resolve();
        } else {
          reject(new AxiosError("Invalid credentials", '401', undefined, undefined, {
            status: 401,
            data: { message: "Invalid email or password provided." }
          } as any));
        }
      }, 1000); // Simulate network delay
    });
  };

  const loginWithGoogle = async (credential: string): Promise<void> => {
    // Simulate API call to your backend with the Google credential
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (credential) { // In a real app, you'd send this to your backend for verification
          setUserState(MOCK_GOOGLE_USER);
          resolve();
        } else {
          reject(new Error("Google authentication failed."));
        }
      }, 1500); // Simulate network delay
    });
  };

  const logout = () => {
    setUserState(null);
  };

  // Rehydrate state from localStorage on initial load
  const init = () => {
    const token = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        _user = JSON.parse(storedUser);
        _isAuthenticated = true;
      } catch (e) {
        console.error("Failed to parse stored user data:", e);
        logout(); // Clear invalid data
      }
    }
  };

  // Run initialization once
  if (!_user && !_isAuthenticated && typeof window !== 'undefined') { // Check for window to ensure client-side
    init();
  }

  // The actual hook for components
  return () => {
    const [state, setState] = useState(getSnapshot());

    useEffect(() => {
      const listener = () => setState(getSnapshot());
      const unsubscribe = subscribe(listener);
      return unsubscribe; // This is now correct, as subscribe returns () => void
    }, []);

    return { ...state, login, loginWithGoogle, logout };
  };
})();

// ===============================================
// End of Mock Authentication Store
// ===============================================


// Regular expressions for validation
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MIN_PASSWORD_LENGTH = 8; // Consistent with RegisterPage's strong password validation


const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login, loginWithGoogle, isAuthenticated } = useAuthStore(); // Use the mock auth store
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
