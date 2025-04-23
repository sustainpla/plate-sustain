
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Donation } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";

export function useMyReservations(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-reservations", userId],
    queryFn: async () => {
      if (!userId) return []; // Return empty array instead of throwing when userId is undefined
      
      console.log("Fetching reservations for user:", userId);
      
      const { data, error } = await supabase
        .from("donations")
        .select(`
          *,
          profiles!donations_donor_id_fkey(name)
        `)
        .eq("reserved_by", userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching reservations:", error);
        toast({
          title: "Error fetching reservations",
          description: "Could not load your reservations. Please refresh the page.",
          variant: "destructive",
        });
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} reservations for user ${userId}:`, data);
      
      if (!data) return [];
      
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
    enabled: true, // Always enable the query, it will return empty array if userId is undefined
    refetchInterval: 2000, // More frequent refetches for better real-time updates
    staleTime: 500, // Consider data stale quickly
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3
  });
}
