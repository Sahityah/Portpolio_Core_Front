import { useEffect, useState, useCallback } from "react";
import { useNavigate, NavLink, Link, Outlet } from "react-router-dom"; // Import Outlet
import {
  LayoutDashboard,
  CreditCard,
  PieChart,
  BarChart4,
  Clock,
  Settings,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  LineChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Assuming this type comes from a shared types file or auth store
type User = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: CreditCard, label: "Positions", path: "/positions" },
  { icon: BarChart4, label: "Trades", path: "/trades" },
  { icon: LineChart, label: "Charts", path: "/charts" },
  { icon: PieChart, label: "Analytics", path: "/analytics" },
];

// No DashboardLayoutProps interface needed as children will be rendered via Outlet

// Mock useAuthStore - Adjusted to include loading state and mock token check
const useAuthStore = () => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true); // New loading state for auth

  // IMPORTANT: This bypass should ONLY be true in a development environment.
  // It MUST be false or controlled by production environment variables.
  const bypassAuth = true; // For demonstration ONLY - **CHANGE THIS FOR PRODUCTION**

  useEffect(() => {
    document.title = "Dashboard - Portfolio Manager";
  }, []);

  useEffect(() => {
    setLoadingAuth(true); // Start loading auth state
    const checkAuthStatus = async () => { // Made async if you'd fetch user data
      if (bypassAuth) {
        setAuthUser({
          id: "test",
          name: "Test User",
          email: "test@example.com",
          avatar: null,
        });
        setIsAuthenticated(true);
        setLoadingAuth(false);
        return;
      }

      // In a real app, you'd check for a token set during login
      const authToken = localStorage.getItem("authToken");

      if (authToken) {
        try {
          // In a real app, you might decode the JWT or call a /me endpoint
          // to get fresh user details based on the token.
          // For this mock, we'll just set a generic user if a token exists.
          setAuthUser({
            id: "real-user-id",
            name: "Real User",
            email: "real@example.com",
            avatar: null, // You can set a default avatar URL here if needed
          });
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Authentication check failed", error);
          localStorage.removeItem("authToken"); // Clear invalid token
          setAuthUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setAuthUser(null);
        setIsAuthenticated(false);
      }
      setLoadingAuth(false); // Auth loading finished
    };

    checkAuthStatus();
    // You might also add an interval to periodically re-check token validity or refresh it
    // const authRefreshInterval = setInterval(checkAuthStatus, 5 * 60 * 1000); // Every 5 minutes
    // return () => clearInterval(authRefreshInterval);
  }, [bypassAuth]); // Add bypassAuth as dependency

  const logout = () => {
    localStorage.removeItem("authToken"); // Clear the token
    localStorage.removeItem("user"); // Clear any cached user data
    setAuthUser(null);
    setIsAuthenticated(false);
    // No need to setLoadingAuth(true) as it's logging out, not loading
  };

  return { user: authUser, isAuthenticated, loadingAuth, logout }; // Expose loadingAuth
};

const DashboardLayout = () => { // Removed children prop
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Get user and auth status from the (mock) auth store
  const { user, isAuthenticated, loadingAuth, logout } = useAuthStore();

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Redirect if not authenticated (after auth store determines state)
  // This serves as a client-side fallback/re-check if auth state changes mid-session.
  // The primary protection is via the `authLoader` in `router.tsx`.
  useEffect(() => {
    if (!loadingAuth && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, loadingAuth, navigate]);


  // Format the date and time - Memoized with useCallback
  const formatDate = useCallback(() => {
    return currentTime.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [currentTime]);

  const formatTime = useCallback(() => {
    return currentTime.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [currentTime]);

  const handleLogout = () => {
    logout(); // Use logout from auth store
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
      variant: "default", // or "success" if you have a custom variant
    });
    // Navigation is handled by the useEffect watching isAuthenticated
  };

  // Robust getInitials function
  const getInitials = (name: string) => {
    return name
      .trim()
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Show a loading spinner if authentication status is still being determined
  // This handles the initial load of DashboardLayout if authLoader isn't immediate,
  // or if the `useAuthStore` itself is fetching initial user data.
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="h-8 w-8 border-4 border-r-transparent border-primary rounded-full animate-spin" />
        <p className="ml-3">Authenticating...</p>
      </div>
    );
  }

  // If loading is finished and user is still not authenticated, the useEffect above should redirect.
  // This final `if (!user)` check is a defensive measure for unexpected states,
  // though ideally, it shouldn't be reached if `authLoader` and `useEffect` work correctly.
  if (!user) {
    return null; // Or a more explicit error/redirect page
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-card text-foreground"> {/* Added text-foreground */}
      {/* Close button for mobile sidebar */}
      {isMobile && (
        <div className="absolute top-4 right-4 z-10">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
      )}
      <div className="px-3 py-4 border-b">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="bg-primary h-8 w-8 rounded flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-primary-foreground" /> {/* Use primary-foreground for icon */}
          </div>
          <h1 className="text-xl font-bold">Portfolio</h1>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`
              }
              onClick={() => isMobile && setIsSidebarOpen(false)} // Close sidebar on mobile click
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t px-3 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTime()}</span>
          </div>
          <div className="text-xs text-muted-foreground">{formatDate()}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground"> {/* Ensure base text color */}
      {/* Sidebar for desktop */}
      {!isMobile && (
        <aside className="w-64 border-r bg-card shrink-0"> {/* Added shrink-0 */}
          <SidebarContent />
        </aside>
      )}

      {/* Mobile sidebar with drawer */}
      {isMobile && (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            {/* The actual trigger button will be in the header below for mobile */}
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] p-0 bg-card"> {/* Added bg-card */}
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top navbar */}
        <header className="h-14 border-b bg-card flex items-center gap-4 px-4 shrink-0"> {/* Added shrink-0 */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)} // Opens the Sheet
              className="md:hidden" // Ensure it's only visible on mobile
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          )}

          {/* Title/branding for mobile when sidebar is closed */}
          {isMobile && (
            <Link to="/dashboard" className="text-xl font-bold ml-2 text-foreground">Portfolio</Link>
          )}

          <div className="ml-auto flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || ""} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2" // Use destructive variant for logout
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main content area where child routes will render */}
        <main className="flex-1 overflow-auto p-4"> {/* Added padding for content */}
          <Outlet /> {/* This is the crucial change for nested routes */}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;