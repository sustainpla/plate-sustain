
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ShoppingBasket, Thermometer } from "lucide-react";
import { Donation } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface DonationCardProps {
  donation: Donation;
  viewType?: "donor" | "ngo" | "volunteer";
  onAction?: (donation: Donation) => void;
  actionLabel?: string;
}

export default function DonationCard({
  donation,
  viewType = "ngo",
  onAction,
  actionLabel,
}: DonationCardProps) {
  const statusMap = {
    listed: "Available",
    reserved: "Reserved",
    pickedUp: "Picked Up",
    delivered: "Delivered",
  };

  const statusClasses = {
    listed: "status-listed",
    reserved: "status-reserved",
    pickedUp: "status-pickedUp",
    delivered: "status-delivered",
  };

  const getActionButton = () => {
    if (!onAction) return null;

    return (
      <Button 
        onClick={() => onAction(donation)}
        variant="default"
        className="bg-sustainPlate-green hover:bg-sustainPlate-green-dark"
      >
        {actionLabel || "View Details"}
      </Button>
    );
  };

  const createdAt = new Date(donation.createdAt);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", 
      donation.status === "listed" ? "border-sustainPlate-status-listed/30" : "",
      donation.status === "reserved" ? "border-sustainPlate-status-reserved/30" : "",
      donation.status === "pickedUp" ? "border-sustainPlate-status-pickedUp/30" : "",
      donation.status === "delivered" ? "border-sustainPlate-status-delivered/30" : ""
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Link to={`/donations/${donation.id}`}>
            <CardTitle className="text-xl hover:text-sustainPlate-green hover:underline transition-colors">
              {donation.title}
            </CardTitle>
          </Link>
          <span className={cn("status-badge", statusClasses[donation.status])}>
            {statusMap[donation.status]}
          </span>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
          <span>{donation.donorName}</span>
          <span>•</span>
          <span>{timeAgo}</span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm mb-4">{donation.description}</p>
        <div className="grid grid-cols-2 gap-3 text-sm mb-2">
          <div className="flex items-center gap-2">
            <ShoppingBasket size={16} className="text-sustainPlate-green"/>
            <span>{donation.foodType}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-sustainPlate-orange"/>
            <span>Expires: {new Date(donation.expiryDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer size={16} className="text-sustainPlate-status-pickedUp"/>
            <span>{donation.storageRequirements}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-sustainPlate-status-listed"/>
            <span>Pickup location</span>
          </div>
        </div>
      </CardContent>
      {onAction && (
        <CardFooter className="pt-0">
          {getActionButton()}
        </CardFooter>
      )}
    </Card>
  );
}
