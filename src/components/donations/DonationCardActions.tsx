
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

      const { error } = await supabase
        .from('donations')
        .update({ 
          status: newStatus,
          reserved_by: newStatus === "reserved" ? currentUserId : donation.reservedBy
        })
        .eq('id', donation.id);

      if (error) throw error;

      // Invalidate relevant queries to force a refresh
      queryClient.invalidateQueries({ queryKey: ["available-donations"] });
      queryClient.invalidateQueries({ queryKey: ["donation-updates"] });
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      
      toast({
        title: "Status updated",
        description: `Donation has been marked as ${newStatus}`,
      });

    } catch (error) {
      console.error("Error updating donation status:", error);
      toast({
        title: "Error updating status",
        description: "There was a problem updating the donation status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-4 flex justify-end gap-2">
      {viewType === "ngo" && donation.status === "listed" && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleStatusUpdate("reserved")}
          className="bg-sustainPlate-status-listed hover:bg-sustainPlate-status-listed/80 text-white"
        >
          <Clock className="mr-2 h-4 w-4" />
          Reserve
        </Button>
      )}
      
      {viewType === "ngo" && donation.status === "reserved" && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleStatusUpdate("delivered")}
          className="bg-sustainPlate-status-delivered hover:bg-sustainPlate-status-delivered/80 text-white"
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
