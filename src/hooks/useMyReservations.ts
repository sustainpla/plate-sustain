
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Donation } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";
import { useEffect } from "react";

export function useMyReservations(userId: string | undefined) {
  const query = useQuery({
    queryKey: ["my-reservations", userId],
    queryFn: async () => {
      if (!userId) return []; 
      
      console.log("Fetching reservations for user:", userId);
      
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      // Different queries for NGO vs Volunteer
      const query = supabase
        .from("donations")
        .select(`
          *,
          profiles!donations_donor_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (userProfile?.role === 'volunteer') {
        query.eq("volunteer_id", userId);
      } else {
        query.eq("reserved_by", userId);
      }

      const { data, error } = await query;

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
    refetchInterval: 2000,
    staleTime: 500,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('reservation-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'donations',
        }, 
        (payload) => {
          console.log("Real-time update for reservations:", payload);
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, query]);

  return query;
}
