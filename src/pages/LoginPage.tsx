import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
import { debounce } from "lodash";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showGoogleLogin, setShowGoogleLogin] = useState(true);

  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const navigate = useNavigate();
  const { toast } = useToast();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !hasNavigated.current) {
      hasNavigated.current = true;
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Debounced email validation
  const validateEmail = useRef(
    debounce((email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.(com|in|net|org)$/i;
      if (!email) {
        setErrors((prev) => ({ ...prev, email: "Email is required" }));
      } else if (!emailRegex.test(email)) {
        setErrors((prev) => ({ ...prev, email: "Invalid email address" }));
      } else {
        setErrors((prev) => ({ ...prev, email: undefined }));
      }
    }, 300)
  ).current;

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email") validateEmail(value);
    if (name === "password")
      setErrors((prev) => ({ ...prev, password: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      toast({
        title: "Login successful",
        description: "Welcome back to your portfolio dashboard",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast({
        title: "Google login failed",
        description: "No credential received from Google.",
        variant: "destructive",
      });
      return;
    }
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast({
        title: "Google login successful",
        description: "Welcome!",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Google login failed",
        description: "Problem authenticating with Google.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">Access your portfolio dashboard</CardDescription>
        </CardHeader>

        <CardContent>
  <div className="space-y-4">
    {showGoogleLogin && (
      <>
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
      </>
    )}

    <form onSubmit={handleSubmit} className="space-y-4">
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
        />
        {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
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
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
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
