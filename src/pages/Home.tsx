
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Utensils, Heart, Calendar, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { isAuthenticated, currentUser } = useAuth();

  const getDashboardLink = () => {
    if (!isAuthenticated) return "/login";
    
    switch (currentUser?.role) {
      case "donor":
        return "/donor/dashboard";
      case "ngo":
        return "/ngo/dashboard";
      case "volunteer":
        return "/volunteer/dashboard";
      default:
        return "/login";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero section */}
      <section className="relative bg-gradient-to-br from-sustainPlate-beige to-white py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter animate-fade-in">
                Connecting surplus food with those who need it most
              </h1>
              <p className="text-muted-foreground md:text-xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
                SustainPlate helps restaurants, grocers, and households donate surplus food to NGOs and food banks, reducing waste and fighting hunger.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <Button 
                  asChild
                  size="lg" 
                  className="bg-sustainPlate-green hover:bg-sustainPlate-green-dark"
                >
                  <Link to={getDashboardLink()}>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/about">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="lg:flex justify-center hidden animate-scale-in" style={{ animationDelay: "0.3s" }}>
              <img
                src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=500&auto=format&fit=crop"
                alt="Food donation"
                className="rounded-lg shadow-lg aspect-[4/3] object-cover"
                width={500}
                height={375}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="py-16 bg-white">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tighter mb-2">How It Works</h2>
            <p className="text-muted-foreground max-w-[700px] mx-auto">
              SustainPlate makes food donation simple, efficient, and accessible for everyone involved.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="bg-sustainPlate-beige/50 border-none animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-sustainPlate-green/20 p-3 mb-4">
                    <Utensils size={24} className="text-sustainPlate-green" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Donors</h3>
                  <p className="text-muted-foreground">
                    List your surplus food with details about quantity, type, and pickup information.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-sustainPlate-beige/50 border-none animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-sustainPlate-green/20 p-3 mb-4">
                    <Heart size={24} className="text-sustainPlate-green" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">NGOs</h3>
                  <p className="text-muted-foreground">
                    Browse available donations and reserve what you need for your community.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-sustainPlate-beige/50 border-none animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-sustainPlate-green/20 p-3 mb-4">
                    <Calendar size={24} className="text-sustainPlate-green" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Volunteers</h3>
                  <p className="text-muted-foreground">
                    Help transport food from donors to NGOs based on your availability.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="py-16 bg-sustainPlate-green/10">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 md:grid-cols-3 text-center">
            <div className="space-y-2">
              <h3 className="text-3xl md:text-4xl font-bold text-sustainPlate-green">1,200+</h3>
              <p className="text-muted-foreground">Meals donated</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl md:text-4xl font-bold text-sustainPlate-green">45+</h3>
              <p className="text-muted-foreground">Partner NGOs</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl md:text-4xl font-bold text-sustainPlate-green">300+</h3>
              <p className="text-muted-foreground">Active volunteers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-16 bg-sustainPlate-beige">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-4">
            Ready to make a difference?
          </h2>
          <p className="text-muted-foreground max-w-[700px] mx-auto mb-6">
            Join our community today and be part of the solution to food waste and hunger.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button 
              asChild 
              size="lg" 
              className="bg-sustainPlate-green hover:bg-sustainPlate-green-dark"
            >
              <Link to="/register">Sign Up Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
