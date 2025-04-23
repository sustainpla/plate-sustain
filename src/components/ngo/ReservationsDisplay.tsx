
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

  if (!reservations || reservations.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-slate-50">
        <p className="text-muted-foreground">You haven't reserved any donations yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Check the available donations page to find donations to reserve.
        </p>
      </div>
    );
  }

  return <NGOReservationTabs reservations={reservations} />;
}
