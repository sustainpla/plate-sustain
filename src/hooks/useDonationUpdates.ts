
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Donation } from "@/lib/types";

export function useDonationUpdates(userId: string) {
  const [donations, setDonations] = useState<Donation[]>([]);

  useEffect(() => {
    // Initial fetch
    const fetchDonations = async () => {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          reserved_by:profiles!donations_reserved_by_fkey(name),
          volunteer:profiles!donations_volunteer_id_fkey(name)
        `)
        .eq('donor_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formattedDonations: Donation[] = data.map(item => ({
          id: item.id,
          donorId: item.donor_id,
          donorName: "", // We don't need this as it's the current user
          title: item.title,
          description: item.description || "",
          foodType: item.food_type,
          quantity: item.quantity,
          expiryDate: item.expiry_date,
          storageRequirements: item.storage_requirements || "",
          pickupAddress: item.pickup_address,
          pickupInstructions: item.pickup_instructions || "",
          status: item.status,
          createdAt: item.created_at || new Date().toISOString(),
          reservedBy: item.reserved_by,
          reservedByName: item.reserved_by?.name,
          pickupTime: item.pickup_time,
          volunteerId: item.volunteer_id,
          volunteerName: item.volunteer?.name,
        }));
        setDonations(formattedDonations);
      }
    };

    fetchDonations();

    // Subscribe to changes
    const channel = supabase
      .channel('donation-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donations',
          filter: `donor_id=eq.${userId}`,
        },
        () => {
          fetchDonations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return donations;
}
