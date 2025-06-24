import { useEffect } from 'react'; // Import useEffect
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Frown } from 'lucide-react'; // Example: Import an icon

function NotFoundPage() {
  const navigate = useNavigate();

  // Enhancement: Set document title for better accessibility and user experience
  useEffect(() => {
    document.title = "404 - Page Not Found";
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4 p-4">
        {/* Enhancement: Add an icon for visual appeal */}
        <Frown className="h-20 w-20 mx-auto text-primary" /> 
        <h1 className="text-5xl md:text-7xl font-bold text-primary">404</h1>
        {/* Enhancement: More engaging message */}
        <p className="text-lg md:text-xl text-muted-foreground">
          Oops! The page you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate('/')} variant="default" size="lg"> {/* Enhancement: Changed button variant and size */}
          Return to Home
        </Button>
      </div>
    </div>
  );
}

export default NotFoundPage;