
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Donation } from "@/lib/types";
import { Eye } from "lucide-react";

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

  return (
    <div className="mt-4 flex justify-end">
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
