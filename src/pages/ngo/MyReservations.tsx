
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import DonationCard from "@/components/donations/DonationCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Donation } from "@/lib/types";

export default function MyReservations() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || currentUser.role !== "ngo") {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["my-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select(`
          *,
          profiles!donations_donor_id_fkey(name)
        `)
        .eq("reserved_by", currentUser?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return data.map(item => ({
        id: item.id,
        donorId: item.donor_id,
        donorName: item.profiles?.name || "Unknown donor",
        title: item.title,
        description: item.description || "",
        foodType: item.food_type,
        quantity: item.quantity,
        expiryDate: item.expiry_date,
        storageRequirements: item.storage_requirements || "Room temperature",
        pickupAddress: item.pickup_address,
        pickupInstructions: item.pickup_instructions || "",
        status: item.status as Donation["status"],
        createdAt: item.created_at || new Date().toISOString(),
        reservedBy: item.reserved_by || undefined,
        pickupTime: item.pickup_time || undefined,
        volunteerId: item.volunteer_id || undefined,
      }));
    },
    enabled: !!currentUser?.id,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">My Reservations</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Food Reservations</CardTitle>
            <CardDescription>
              Track the status of your food reservations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : reservations?.length ? (
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="reserved">Pending Pickup</TabsTrigger>
                  <TabsTrigger value="pickedUp">In Transit</TabsTrigger>
                  <TabsTrigger value="delivered">Received</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reservations.map((donation) => (
                      <DonationCard 
                        key={donation.id} 
                        donation={donation}
                        viewType="ngo"
                      />
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="reserved">
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
                </TabsContent>
                <TabsContent value="pickedUp">
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
                </TabsContent>
                <TabsContent value="delivered">
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
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">You haven't reserved any donations yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
