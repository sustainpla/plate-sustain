
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
      console.log("Starting reservation process for donation:", donation.id);
      
      // First check if the donation is still available
      const { data: checkData, error: checkError } = await supabase
        .from("donations")
        .select("status, reserved_by")
        .eq("id", donation.id)
        .single();
      
      if (checkError) {
        console.error("Error checking donation status:", checkError);
        throw new Error("Could not check donation availability");
      }
      
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
      
      console.log("Donation is available. Proceeding with reservation");
      console.log("User ID:", currentUser.id);
      
      // If still available, reserve it
      const { data, error } = await supabase
        .from("donations")
        .update({
          status: "reserved",
          reserved_by: currentUser.id,
        })
        .eq("id", donation.id)
        .select();
      
      if (error) {
        console.error("Reservation update error:", error);
        throw new Error("Failed to update reservation status");
      }
      
      console.log("Reservation update response:", data);
      
      if (!data || data.length === 0) {
        throw new Error("No data returned from reservation update");
      }
      
      // Set success state to show confirmation before redirect
      setReservationSuccess(true);
      
      // Invalidate all relevant queries to force a refresh
      queryClient.invalidateQueries({ queryKey: ["available-donations"] });
      queryClient.invalidateQueries({ queryKey: ["donation-updates"] });
      queryClient.invalidateQueries({ queryKey: ["my-reservations", currentUser.id] });
      queryClient.invalidateQueries({ queryKey: ["donation", donation.id] });
      
      toast({
        title: "Donation reserved",
        description: "You have successfully reserved this donation",
      });
      
      // Wait a bit to show success state before navigating
      setTimeout(() => {
        navigate("/ngo/my-reservations");
      }, 1500);
    } catch (error) {
      console.error("Reservation error:", error);
      toast({
        title: "Reservation failed",
        description: "There was an error reserving this donation. Please try again.",
        variant: "destructive",
      });
      setIsReserving(false);
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
