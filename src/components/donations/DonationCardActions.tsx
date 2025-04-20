
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Donation } from "@/lib/types";
import { Eye, ClockCheck, PackageCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface DonationCardActionsProps {
  donation: Donation;
  viewType: "donor" | "ngo" | "volunteer";
}

export default function DonationCardActions({ donation, viewType }: DonationCardActionsProps) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    if (viewType === "donor") {
      navigate(`/donor/donation/${donation.id}`);
    } else if (viewType === "ngo") {
      navigate(`/ngo/donation/${donation.id}`);
    }
  };

  const handleStatusUpdate = async (newStatus: "reserved" | "delivered") => {
    try {
      const { error } = await supabase
        .from('donations')
        .update({ status: newStatus })
        .eq('id', donation.id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Donation has been marked as ${newStatus}`,
      });

    } catch (error) {
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
        >
          <ClockCheck className="mr-2 h-4 w-4" />
          Reserve
        </Button>
      )}
      
      {viewType === "ngo" && donation.status === "reserved" && (
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
