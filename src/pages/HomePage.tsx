import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BarChart4, 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  LineChart, 
  DollarSign,
  Clock 
} from "lucide-react";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Update time every second
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = () => {
    return currentTime.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary h-8 w-8 rounded flex items-center justify-center">
              <BarChart4 className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold">Portfolio Manager</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> 
              <span className="hidden lg:inline">{formatDate()}</span>
              <span>{formatTime()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-sky-100/50 py-16 md:py-24">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8">
            <Badge variant="secondary" className="px-3 py-1">
              <TrendingUp className="h-3.5 w-3.5 mr-1" />
              <span>Advanced Portfolio Management</span>
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Manage Your Investments with Confidence
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Track positions, monitor performance, and make informed decisions with our powerful portfolio management platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate("/register")} className="gap-2">
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/dashboard")}>
                View Demo Dashboard
              </Button>
            </div>
          </div>
          <div className="flex-1">
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop"
              alt="Portfolio Management Dashboard"
              className="rounded-lg shadow-xl w-full"
            />
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features for Investors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="portfolio-card">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-5">
                  <BarChart4 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Position Tracking</h3>
                <p className="text-muted-foreground">
                  Monitor all your investment positions in real-time with detailed analytics and performance metrics.
                </p>
              </CardContent>
            </Card>
            
            <Card className="portfolio-card">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-5">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground">
                  Visualize performance trends, analyze risk metrics, and gain insights to optimize your investment strategy.
                </p>
              </CardContent>
            </Card>
            
            <Card className="portfolio-card">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-5">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Profit & Loss Tracking</h3>
                <p className="text-muted-foreground">
                  Detailed P&L reports with daily, weekly, and monthly breakdowns to understand your portfolio performance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Dashboard Preview */}
      <section className="py-16 bg-gradient-to-b from-sky-50/50 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Dashboard Experience</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our intuitive dashboard gives you complete visibility into your investments,
              with powerful tools to make informed decisions.
            </p>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop"
              alt="Dashboard Preview"
              className="rounded-xl shadow-xl w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-xl flex items-end">
              <div className="p-6 md:p-10 text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to take control of your portfolio?</h3>
                <Button size="lg" onClick={() => navigate("/register")} className="gap-2 bg-white text-primary hover:bg-white/90 hover:text-primary">
                  Get Started Today
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary h-8 w-8 rounded flex items-center justify-center">
                <BarChart4 className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-bold">Portfolio Manager</h2>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Portfolio Manager. All rights reserved.
              </p>
              <div className="mt-2 flex items-center justify-center md:justify-end gap-4">
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;