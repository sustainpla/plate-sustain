
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Home, 
  Menu, 
  X, 
  LogOut, 
  User, 
  Utensils, 
  Heart, 
  Calendar,
  List,
  Bell,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

const NavItem = ({ to, label, icon, onClick, active }: NavItemProps) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        active
          ? "bg-sustainPlate-green-light/20 text-sustainPlate-green-dark"
          : "hover:bg-sustainPlate-green-light/10 text-foreground/80 hover:text-sustainPlate-green"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Determine navigation items based on user role
  const getNavItems = () => {
    const role = currentUser?.role;
    
    const commonItems = [
      {
        to: "/profile",
        label: "Profile",
        icon: <User size={20} />,
      },
    ];

    if (role === "donor") {
      return [
        {
          to: "/donor/dashboard",
          label: "Dashboard",
          icon: <Home size={20} />,
        },
        {
          to: "/donor/donations",
          label: "My Donations",
          icon: <Utensils size={20} />,
        },
        {
          to: "/donor/create-donation",
          label: "Create Donation",
          icon: <List size={20} />,
        },
        ...commonItems,
      ];
    }

    if (role === "ngo") {
      return [
        {
          to: "/ngo/dashboard",
          label: "Dashboard",
          icon: <Home size={20} />,
        },
        {
          to: "/ngo/available-donations",
          label: "Available Donations",
          icon: <Utensils size={20} />,
        },
        {
          to: "/ngo/reservations",
          label: "My Reservations",
          icon: <Heart size={20} />,
        },
        ...commonItems,
      ];
    }

    if (role === "volunteer") {
      return [
        {
          to: "/volunteer/dashboard",
          label: "Dashboard",
          icon: <Home size={20} />,
        },
        {
          to: "/volunteer/available-tasks",
          label: "Available Tasks",
          icon: <List size={20} />,
        },
        {
          to: "/volunteer/my-schedule",
          label: "My Schedule",
          icon: <Calendar size={20} />,
        },
        ...commonItems,
      ];
    }

    // Default navigation for logged out users
    return [
      {
        to: "/",
        label: "Home",
        icon: <Home size={20} />,
      },
      {
        to: "/about",
        label: "About",
        icon: <Heart size={20} />,
      },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          {/* Logo & Mobile Menu Button */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/lovable-uploads/ed233620-3184-47b8-86ea-d13908d35950.png"
                alt="SustainPlate Logo"
                className="w-8 h-8 rounded-full"
              />
              <span className="font-semibold text-xl hidden sm:inline-block">SustainPlate</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex ml-8 flex-1 items-center gap-6">
            {isAuthenticated && navItems.map((item, index) => (
              <NavItem
                key={index}
                to={item.to}
                label={item.label}
                icon={item.icon}
                active={location.pathname === item.to}
              />
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="ml-auto flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative"
                >
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-sustainPlate-orange rounded-full"></span>
                </Button>
                <Button variant="ghost" onClick={handleLogout}>
                  <LogOut size={20} className="mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => navigate("/register")}
                  className="bg-sustainPlate-green hover:bg-sustainPlate-green-dark"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-20 bg-background md:hidden">
          <nav className="container py-4">
            <div className="flex flex-col gap-2">
              {navItems.map((item, index) => (
                <NavItem
                  key={index}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  active={location.pathname === item.to}
                />
              ))}
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  className="flex items-center justify-start gap-3 px-3 py-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Utensils size={18} className="text-sustainPlate-green" />
            <span className="font-semibold">SustainPlate</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SustainPlate. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </Link>
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
