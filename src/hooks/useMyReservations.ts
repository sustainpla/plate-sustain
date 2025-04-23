
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Donation } from "@/lib/types";

export function useMyReservations(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-reservations", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User not authenticated");
      
      console.log("Fetching reservations for user:", userId);
      
      const { data, error } = await supabase
        .from("donations")
        .select(`
          *,
          profiles!donations_donor_id_fkey(name)
        `)
        .eq("reserved_by", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reservations:", error);
        throw error;
      }
      
      console.log(`Found ${data.length} reservations for user ${userId}`);
      
      // Map the database response to match our Donation type
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
    enabled: !!userId,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    staleTime: 3000 // Consider data stale after 3 seconds
  });
}
