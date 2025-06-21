import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  CreditCard, 
  PieChart, 
  BarChart4, 
  Clock, 
  Settings, 
  User, 
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

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check if user is logged in
  const bypassAuth = true; // set to false when deploying

useEffect(() => {
  if (bypassAuth) {
    setUser({
      id: "test",
      name: "Test User",
      email: "test@example.com",
      avatar: null,
    });
    return;
  }

  const userData = localStorage.getItem("user");
  if (!userData) {
    navigate("/login");
    return;
  }

  try {
    setUser(JSON.parse(userData));
  } catch (error) {
    localStorage.removeItem("user");
    navigate("/login");
  }
}, [navigate]);


  // Format the date and time
  const formatDate = () => {
    return currentTime.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Show nothing if user data is not loaded
  if (!user) {
    return null;
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="px-3 py-4 border-b">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="bg-primary h-8 w-8 rounded flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold">Portfolio</h1>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent ${
                window.location.pathname === item.path
                  ? "bg-accent font-medium"
                  : "text-muted-foreground"
              }`}
              onClick={() => isMobile && setIsSidebarOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
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
    <div className="flex h-screen bg-background">
      {/* Sidebar for desktop */}
      {!isMobile && (
        <aside className="w-64 border-r bg-card">
          <SidebarContent />
        </aside>
      )}

      {/* Mobile sidebar with drawer */}
      {isMobile && (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="w-[240px] p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top navbar */}
        <header className="h-14 border-b bg-card flex items-center gap-4 px-4">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
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
                    <User className="h-4 w-4" /> 
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
                  className="cursor-pointer text-red-500 focus:text-red-500 flex items-center gap-2" 
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;