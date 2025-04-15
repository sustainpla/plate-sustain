
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Donation } from "@/lib/types";
import { donations as mockDonations } from "@/lib/mock-data";
import DonationCard from "@/components/donations/DonationCard";
import { Search, ChevronRight, ShoppingBasket, Package, Truck, Check } from "lucide-react";

export default function NGODashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Donation[]>([]);
  const [availableDonations, setAvailableDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    pickups: 0,
    received: 0,
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== "ngo") {
      navigate("/login");
      return;
    }

    // Filter donations for the current NGO
    const ngoReservations = mockDonations.filter(
      (donation) => donation.reservedBy === currentUser.id
    );
    
    // Filter available donations
    const available = mockDonations.filter(
      (donation) => donation.status === "listed"
    );
    
    setReservations(ngoReservations);
    setAvailableDonations(available);

    // Calculate stats
    setStats({
      total: ngoReservations.length,
      pending: ngoReservations.filter((d) => d.status === "reserved").length,
      pickups: ngoReservations.filter((d) => d.status === "pickedUp").length,
      received: ngoReservations.filter((d) => d.status === "delivered").length,
    });
  }, [currentUser, navigate]);

  const getRecentAvailableDonations = () => {
    return availableDonations.slice(0, 3);
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">NGO Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your food reservations and find available donations
            </p>
          </div>
          <Button 
            onClick={() => navigate("/ngo/available-donations")}
            className="mt-4 md:mt-0 bg-sustainPlate-green hover:bg-sustainPlate-green-dark"
          >
            <Search size={16} className="mr-2" />
            Browse Donations
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="flex flex-row items-center p-6">
              <ShoppingBasket size={40} className="text-sustainPlate-green mr-4" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reservations</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-row items-center p-6">
              <div className="rounded-full bg-sustainPlate-status-reserved/20 p-2 mr-4">
                <Package size={24} className="text-sustainPlate-status-reserved" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Pickup</p>
                <h3 className="text-2xl font-bold">{stats.pending}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-row items-center p-6">
              <div className="rounded-full bg-sustainPlate-status-pickedUp/20 p-2 mr-4">
                <Truck size={24} className="text-sustainPlate-status-pickedUp" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                <h3 className="text-2xl font-bold">{stats.pickups}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-row items-center p-6">
              <div className="rounded-full bg-sustainPlate-status-delivered/20 p-2 mr-4">
                <Check size={24} className="text-sustainPlate-status-delivered" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Received</p>
                <h3 className="text-2xl font-bold">{stats.received}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Available Donations */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Available Donations</CardTitle>
            <CardDescription>
              Recently listed food donations in your area
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableDonations.length > 0 ? (
              <div className="space-y-4">
                {getRecentAvailableDonations().map((donation) => (
                  <DonationCard 
                    key={donation.id} 
                    donation={donation} 
                    viewType="ngo"
                    onAction={() => navigate(`/ngo/donation/${donation.id}`)}
                    actionLabel="Reserve"
                  />
                ))}
                {availableDonations.length > 3 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate("/ngo/available-donations")}
                  >
                    View All Available Donations
                    <ChevronRight size={16} className="ml-2" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No available donations at the moment</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservations */}
        <Card>
          <CardHeader>
            <CardTitle>Your Reservations</CardTitle>
            <CardDescription>
              Track the status of your food reservations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="reserved">Pending Pickup</TabsTrigger>
                <TabsTrigger value="pickedUp">In Transit</TabsTrigger>
                <TabsTrigger value="delivered">Received</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                {reservations.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reservations.map((donation) => (
                      <DonationCard 
                        key={donation.id} 
                        donation={donation} 
                        viewType="ngo"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No reservations found</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="reserved">
                {reservations.filter(d => d.status === "reserved").length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reservations
                      .filter(d => d.status === "reserved")
                      .map((donation) => (
                        <DonationCard 
                          key={donation.id} 
                          donation={donation} 
                          viewType="ngo"
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No pending pickups found</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="pickedUp">
                {reservations.filter(d => d.status === "pickedUp").length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reservations
                      .filter(d => d.status === "pickedUp")
                      .map((donation) => (
                        <DonationCard 
                          key={donation.id} 
                          donation={donation} 
                          viewType="ngo"
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No in-transit donations found</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="delivered">
                {reservations.filter(d => d.status === "delivered").length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reservations
                      .filter(d => d.status === "delivered")
                      .map((donation) => (
                        <DonationCard 
                          key={donation.id} 
                          donation={donation} 
                          viewType="ngo"
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No received donations found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
