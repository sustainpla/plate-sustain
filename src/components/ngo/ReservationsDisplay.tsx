
import { Loader2 } from "lucide-react";
import { Donation } from "@/lib/types";
import NGOReservationTabs from "@/components/ngo/NGOReservationTabs";

interface ReservationsDisplayProps {
  reservations: Donation[] | undefined;
  isLoading: boolean;
}

export default function ReservationsDisplay({ reservations, isLoading }: ReservationsDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sustainPlate-green" />
      </div>
    );
  }

  return <NGOReservationTabs reservations={reservations || []} />;
}
