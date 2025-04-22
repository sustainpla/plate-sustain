
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Donation } from "@/lib/types";
import { User } from "@/lib/types";

interface ReservationButtonProps {
  donation: Donation;
  currentUser: User | null;
}

export default function ReservationButton({ donation, currentUser }: ReservationButtonProps) {
  const [isReserving, setIsReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleReserveDonation = async () => {
    if (!currentUser || !donation) return;
    
    setIsReserving(true);
    try {
      // First check if the donation is still available
      const { data: checkData, error: checkError } = await supabase
        .from("donations")
        .select("status, reserved_by")
        .eq("id", donation.id)
        .single();
      
      if (checkError) throw checkError;
      
      // If already reserved, show an error
      if (checkData.status !== "listed" || checkData.reserved_by) {
        toast({
          title: "Already reserved",
          description: "This donation has already been reserved by someone else.",
          variant: "destructive",
        });
        setIsReserving(false);
        return;
      }
      
      // If still available, reserve it
      const { error } = await supabase
        .from("donations")
        .update({
          status: "reserved",
          reserved_by: currentUser.id,
        })
        .eq("id", donation.id);
      
      if (error) throw error;
      
      // Set success state to show confirmation before redirect
      setReservationSuccess(true);
      
      // Invalidate queries to force a refresh
      queryClient.invalidateQueries({ queryKey: ["available-donations"] });
      queryClient.invalidateQueries({ queryKey: ["donation-updates"] });
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["donation", donation.id] });
      
      toast({
        title: "Donation reserved",
        description: "You have successfully reserved this donation",
      });
      
      // Navigate to My Reservations after short delay to show success state
      setTimeout(() => {
        navigate("/ngo/my-reservations");
      }, 1500);
    } catch (error) {
      console.error("Reservation error:", error);
      toast({
        title: "Reservation failed",
        description: "There was an error reserving this donation. It may already be reserved.",
        variant: "destructive",
      });
    } finally {
      if (!reservationSuccess) {
        setIsReserving(false);
      }
    }
  };

  if (donation.status !== "listed") {
    return null;
  }

  return (
    <Button 
      onClick={handleReserveDonation}
      disabled={isReserving || reservationSuccess}
      className="w-full md:w-auto bg-sustainPlate-green hover:bg-sustainPlate-green-dark"
    >
      {reservationSuccess ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Reserved! Redirecting...
        </>
      ) : isReserving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Reserving...
        </>
      ) : (
        "Reserve This Donation"
      )}
    </Button>
  );
}
