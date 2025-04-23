
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VolunteerTask } from "@/lib/types";
import { useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

export function useVolunteerTasks(userId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch available tasks (reserved donations without volunteer)
  const availableTasks = useQuery({
    queryKey: ["available-tasks"],
    queryFn: async () => {
      if (!userId) return [];

      try {
        const { data, error } = await supabase
          .from("donations")
          .select(`
            id,
            title,
            pickup_address,
            pickup_time,
            status,
            profiles!donations_donor_id_fkey(name),
            profiles!donations_reserved_by_fkey(name, address)
          `)
          .eq("status", "reserved")
          .is("volunteer_id", null);

        if (error) {
          console.error("Error fetching available tasks:", error);
          toast({
            title: "Error fetching available tasks",
            description: error.message,
            variant: "destructive"
          });
          throw error;
        }
        
        console.log(`Found ${data?.length || 0} available tasks`);
        
        return data.map(item => ({
          id: item.id,
          donationId: item.id,
          donationTitle: item.title,
          pickupAddress: item.pickup_address,
          deliveryAddress: item.profiles?.address || "Contact NGO for address",
          pickupTime: item.pickup_time || new Date().toISOString(),
          status: "available" as const,
          volunteerId: undefined,
          volunteerName: undefined
        })) as VolunteerTask[];
      } catch (error) {
        console.error("Exception fetching available tasks:", error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Fetch assigned tasks
  const assignedTasks = useQuery({
    queryKey: ["assigned-tasks", userId],
    queryFn: async () => {
      if (!userId) return [];

      try {
        const { data, error } = await supabase
          .from("donations")
          .select(`
            id,
            title,
            pickup_address,
            pickup_time,
            status,
            profiles!donations_donor_id_fkey(name),
            profiles!donations_reserved_by_fkey(name, address)
          `)
          .eq("volunteer_id", userId);

        if (error) {
          console.error("Error fetching assigned tasks:", error);
          toast({
            title: "Error fetching your tasks",
            description: error.message,
            variant: "destructive"
          });
          throw error;
        }
        
        console.log(`Found ${data?.length || 0} assigned tasks for volunteer ${userId}`);
        
        return data.map(item => ({
          id: item.id,
          donationId: item.id,
          donationTitle: item.title,
          pickupAddress: item.pickup_address,
          deliveryAddress: item.profiles?.address || "Contact NGO for address",
          pickupTime: item.pickup_time || new Date().toISOString(),
          status: item.status === "pickedUp" ? "pickedUp" as const : 
                item.status === "delivered" ? "completed" as const : 
                "assigned" as const,
          volunteerId: userId,
          volunteerName: undefined
        })) as VolunteerTask[];
      } catch (error) {
        console.error("Exception fetching assigned tasks:", error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    // Subscribe to changes for available and assigned tasks
    const channel = supabase
      .channel('volunteer-task-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'donations'
        }, 
        (payload) => {
          console.log("Real-time update for volunteer tasks:", payload);
          
          // Check if this is a change to a task assigned to this volunteer
          if (payload.new && payload.new.volunteer_id === userId) {
            queryClient.invalidateQueries({ queryKey: ["assigned-tasks", userId] });
          } 
          // Or if this is a change to an available task
          else if (payload.new && payload.new.status === "reserved" && !payload.new.volunteer_id) {
            queryClient.invalidateQueries({ queryKey: ["available-tasks"] });
          }
          // Or if this is a change from available to assigned
          else if (payload.old && payload.old.status === "reserved" && !payload.old.volunteer_id) {
            queryClient.invalidateQueries({ queryKey: ["available-tasks"] });
          }
        }
      )
      .subscribe();

    console.log("Subscribed to volunteer task changes");

    return () => {
      console.log("Unsubscribing from volunteer task changes");
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return { 
    availableTasks: availableTasks.data || [], 
    isLoadingAvailable: availableTasks.isLoading,
    assignedTasks: assignedTasks.data || [], 
    isLoadingAssigned: assignedTasks.isLoading,
    refetchAvailable: availableTasks.refetch,
    refetchAssigned: assignedTasks.refetch
  };
}
