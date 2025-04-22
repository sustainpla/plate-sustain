
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Donation } from "@/lib/types";
import { Eye, Clock, PackageCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface DonationCardActionsProps {
  donation: Donation;
  viewType: "donor" | "ngo" | "volunteer";
}

export default function DonationCardActions({ donation, viewType }: DonationCardActionsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleViewDetails = () => {
    if (viewType === "donor") {
      navigate(`/donor/donation/${donation.id}`);
    } else if (viewType === "ngo") {
      navigate(`/ngo/donation/${donation.id}`);
    }
  };

  const handleStatusUpdate = async (newStatus: "reserved" | "delivered") => {
    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;
      
      if (!currentUserId) {
        toast({
          title: "Authentication error",
          description: "You must be logged in to perform this action",
          variant: "destructive",
        });
        return;
      }

      // For reservations, first check if the donation is still available
      if (newStatus === "reserved") {
        const { data: currentDonation } = await supabase
          .from('donations')
          .select('status')
          .eq('id', donation.id)
          .single();

        if (currentDonation?.status !== "listed") {
          toast({
            title: "Reservation failed",
            description: "This donation has already been reserved by another NGO",
            variant: "destructive",
          });
          // Refresh to get latest state
          queryClient.invalidateQueries({ queryKey: ["available-donations"] });
          return;
        }
      }

      const { error } = await supabase
        .from('donations')
        .update({ 
          status: newStatus,
          reserved_by: newStatus === "reserved" ? currentUserId : donation.reservedBy
        })
        .eq('id', donation.id)
        .eq('status', newStatus === "reserved" ? "listed" : "reserved"); // Only allow reserving if listed, delivering if reserved

      if (error) throw error;

      // Invalidate relevant queries to force a refresh
      queryClient.invalidateQueries({ queryKey: ["available-donations"] });
      queryClient.invalidateQueries({ queryKey: ["donation-updates"] });
      
      toast({
        title: "Status updated",
        description: `Donation has been ${newStatus === "reserved" ? "reserved" : "marked as delivered"}`,
      });

      // Navigate to reservations page when successfully reserved
      if (newStatus === "reserved") {
        setTimeout(() => {
          navigate("/ngo/reservations");
        }, 1000);
      }

    } catch (error) {
      console.error("Error updating donation status:", error);
      toast({
        title: "Error updating status",
        description: "There was a problem updating the donation status",
        variant: "destructive",
      });
    }
  };

  // Only show reserve button for NGOs on listed donations
  const showReserveButton = viewType === "ngo" && donation.status === "listed";
  // Only show deliver button for NGOs on their reserved donations
  const showDeliverButton = viewType === "ngo" && donation.status === "reserved";

  return (
    <div className="mt-4 flex justify-end gap-2">
      {showReserveButton && (
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => handleStatusUpdate("reserved")}
          className="bg-sustainPlate-green hover:bg-sustainPlate-green-dark text-white"
        >
          <Clock className="mr-2 h-4 w-4" />
          Reserve
        </Button>
      )}
      
      {showDeliverButton && donation.status === "reserved" && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleStatusUpdate("delivered")}
        >
          <PackageCheck className="mr-2 h-4 w-4" />
          Mark Delivered
        </Button>
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleViewDetails}
      >
        <Eye className="mr-2 h-4 w-4" />
        View Details
      </Button>
    </div>
  );
}
