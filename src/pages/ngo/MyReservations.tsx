
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Donation } from "@/lib/types";
import { Loader2 } from "lucide-react";
import NGOReservationTabs from "@/components/ngo/NGOReservationTabs";

export default function MyReservations() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || currentUser.role !== "ngo") {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["my-reservations", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) throw new Error("User not authenticated");
      
      console.log("Fetching reservations for user:", currentUser.id);
      
      const { data, error } = await supabase
        .from("donations")
        .select(`
          *,
          profiles!donations_donor_id_fkey(name)
        `)
        .eq("reserved_by", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reservations:", error);
        throw error;
      }
      
      console.log(`Found ${data.length} reservations`);
      
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
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">My Reservations</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sustainPlate-green" />
          </div>
        ) : (
          <NGOReservationTabs reservations={reservations || []} />
        )}
      </div>
    </Layout>
  );
}
