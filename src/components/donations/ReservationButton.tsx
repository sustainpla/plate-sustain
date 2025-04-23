
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
    if (!currentUser || !donation) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to reserve a donation",
        variant: "destructive",
      });
      return;
    }
    
    setIsReserving(true);
    
    try {
      console.log("Starting reservation process for donation:", donation.id);
      console.log("Current user attempting reservation:", currentUser.id);
      
      // First check if the donation is still available with a small delay to ensure no race condition
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: checkData, error: checkError } = await supabase
        .from("donations")
        .select("status, reserved_by")
        .eq("id", donation.id)
        .single();
      
      console.log("Check donation status response:", checkData, checkError);
      
      if (checkError) {
        console.error("Error checking donation status:", checkError);
        throw new Error(`Could not check donation availability: ${checkError.message}`);
      }
      
      // If already reserved, show an error
      if (checkData.status !== "listed" || checkData.reserved_by) {
        console.log("Donation already reserved:", checkData);
        toast({
          title: "Already reserved",
          description: "This donation has already been reserved by someone else.",
          variant: "destructive",
        });
        setIsReserving(false);
        return;
      }
      
      console.log("Donation is available. Proceeding with reservation");
      
      // Use explicit transaction with retries
      let updateSuccess = false;
      let retries = 3;
      
      while (!updateSuccess && retries > 0) {
        const { error: updateError, data: updateData } = await supabase
          .from("donations")
          .update({
            status: "reserved",
            reserved_by: currentUser.id
          })
          .eq("id", donation.id)
          .eq("status", "listed")  // Only update if status is still "listed"
          .is("reserved_by", null) // Only update if reserved_by is still null
          .select();
        
        if (updateError) {
          console.error("Reservation update error:", updateError);
          retries--;
          if (retries > 0) {
            console.log(`Retrying reservation... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw new Error(`Failed to update reservation status after multiple attempts: ${updateError.message}`);
          }
        } else {
          updateSuccess = true;
          console.log("Update successful:", updateData);
        }
      }
      
      if (!updateSuccess) {
        throw new Error("Failed to reserve donation after multiple attempts");
      }
      
      console.log("Reservation successful!");
      
      // Double-check that the reservation was successful
      const { data: verifyData, error: verifyError } = await supabase
        .from("donations")
        .select("status, reserved_by")
        .eq("id", donation.id)
        .single();
        
      console.log("Verification check response:", verifyData, verifyError);
        
      if (verifyError) {
        console.error("Verification error:", verifyError);
        throw new Error(`Verification failed: ${verifyError.message}`);
      }
        
      if (!verifyData || verifyData.reserved_by !== currentUser.id) {
        console.error("Verification failed: Reserved by doesn't match current user");
        throw new Error("Reservation verification failed");
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
      }, 3000); // Longer delay to ensure data consistency
    } catch (error: any) {
      console.error("Reservation error:", error);
      toast({
        title: "Reservation failed",
        description: "There was an error reserving this donation. Please try again.",
        variant: "destructive",
      });
      setIsReserving(false);
    }
  };

  // Only show the button if the donation is available and not already reserved
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
