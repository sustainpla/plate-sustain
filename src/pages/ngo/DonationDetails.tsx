
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Donation } from "@/lib/types";
import { Loader2, MapPin, Calendar, Thermometer, Package, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DonationDetails() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isReserving, setIsReserving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUser || currentUser.role !== "ngo") {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const { data: donation, isLoading, refetch } = useQuery({
    queryKey: ["donation", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*, profiles!donations_donor_id_fkey(name)")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        donorId: data.donor_id,
        donorName: data.profiles?.name || "Unknown donor",
        title: data.title,
        description: data.description || "",
        foodType: data.food_type,
        quantity: data.quantity,
        expiryDate: data.expiry_date,
        storageRequirements: data.storage_requirements || "Room temperature",
        pickupAddress: data.pickup_address,
        pickupInstructions: data.pickup_instructions || "",
        status: data.status as Donation["status"],
        createdAt: data.created_at || new Date().toISOString(),
        reservedBy: data.reserved_by || undefined,
        pickupTime: data.pickup_time || undefined,
      };
    },
    enabled: !!id && !!currentUser?.id,
  });

  // Set up real-time subscription to this specific donation
  useEffect(() => {
    if (!id) return;
    
    // Subscribe to changes for this specific donation
    const channel = supabase
      .channel(`donation-${id}-changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'donations',
          filter: `id=eq.${id}`
        }, 
        () => {
          // When the donation changes, refetch it
          refetch();
          // Also invalidate the available donations and my reservations queries
          queryClient.invalidateQueries({ queryKey: ["available-donations"] });
          queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refetch, queryClient]);

  const handleReserveDonation = async () => {
    if (!currentUser || !donation) return;
    
    setIsReserving(true);
    try {
      const { error } = await supabase
        .from("donations")
        .update({
          status: "reserved",
          reserved_by: currentUser.id,
        })
        .eq("id", donation.id)
        .eq("status", "listed"); // Only allow reserving if still listed
      
      if (error) throw error;
      
      // Invalidate queries to force a refresh
      queryClient.invalidateQueries({ queryKey: ["available-donations"] });
      queryClient.invalidateQueries({ queryKey: ["donation-updates"] });
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["donation", donation.id] });
      
      toast({
        title: "Donation reserved",
        description: "You have successfully reserved this donation",
      });
      
      // Navigate to My Reservations after successful reservation
      navigate("/ngo/my-reservations");
    } catch (error) {
      console.error("Reservation error:", error);
      toast({
        title: "Reservation failed",
        description: "There was an error reserving this donation. It may already be reserved.",
        variant: "destructive",
      });
    } finally {
      setIsReserving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!donation) {
    return (
      <Layout>
        <div className="container py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Donation not found</h2>
                <p className="text-muted-foreground mb-4">
                  The donation you are looking for does not exist or has been removed.
                </p>
                <Button onClick={() => navigate("/ngo/available-donations")}>
                  Back to Available Donations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const createdAt = new Date(donation.createdAt);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });
  const expiryDate = new Date(donation.expiryDate);

  return (
    <Layout>
      <div className="container py-8">
        <Button
          variant="outline"
          onClick={() => navigate("/ngo/available-donations")}
          className="mb-6"
        >
          Back to Available Donations
        </Button>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <CardTitle className="text-2xl">{donation.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Posted by {donation.donorName} • {timeAgo}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`status-badge status-${donation.status}`}>
                  {donation.status === "listed" ? "Available" : 
                   donation.status === "reserved" ? "Reserved" : 
                   donation.status === "pickedUp" ? "Picked Up" : "Delivered"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p>{donation.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Food Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-sustainPlate-green" />
                    <div>
                      <p className="font-medium">Food Type</p>
                      <p>{donation.foodType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-sustainPlate-orange" />
                    <div>
                      <p className="font-medium">Quantity</p>
                      <p>{donation.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">Expiry Date</p>
                      <p>{expiryDate.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-sustainPlate-status-pickedUp" />
                    <div>
                      <p className="font-medium">Storage Requirements</p>
                      <p>{donation.storageRequirements}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Pickup Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-sustainPlate-status-listed mt-1" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p>{donation.pickupAddress}</p>
                    </div>
                  </div>
                  {donation.pickupInstructions && (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-1" />
                      <div>
                        <p className="font-medium">Instructions</p>
                        <p>{donation.pickupInstructions}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          
          {donation.status === "listed" && (
            <CardFooter>
              <Button 
                onClick={handleReserveDonation}
                disabled={isReserving}
                className="w-full md:w-auto bg-sustainPlate-green hover:bg-sustainPlate-green-dark"
              >
                {isReserving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reserving...
                  </>
                ) : (
                  "Reserve This Donation"
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </Layout>
  );
}
