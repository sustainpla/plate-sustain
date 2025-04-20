
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Donation } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import DonationEditForm from "@/components/donations/DonationEditForm";
import { toast } from "@/components/ui/use-toast";

export default function DonationDetails() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "donor") {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const { data: donation, isLoading, error, refetch } = useQuery({
    queryKey: ["donation", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Ensure this donation belongs to the current user
      if (data.donor_id !== currentUser?.id) {
        navigate("/donor/donations");
        throw new Error("Unauthorized");
      }
      
      // Map the database response to match our Donation type
      return {
        id: data.id,
        donorId: data.donor_id,
        donorName: currentUser?.name || "Unknown",
        title: data.title,
        description: data.description || "",
        foodType: data.food_type,
        quantity: data.quantity,
        expiryDate: data.expiry_date,
        storageRequirements: data.storage_requirements || "Room temperature",
        pickupAddress: data.pickup_address,
        pickupInstructions: data.pickup_instructions || "",
        status: data.status as Donation["status"],
        createdAt: data.created_at || new Date().toISOString(),
        reservedBy: data.reserved_by || undefined,
        reservedByName: undefined,
        pickupTime: data.pickup_time || undefined,
        volunteerId: data.volunteer_id || undefined,
        volunteerName: undefined,
      } as Donation;
    },
    enabled: !!id && !!currentUser?.id,
  });

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleDonationUpdated = () => {
    setIsEditing(false);
    refetch();
    toast({
      title: "Donation updated",
      description: "Your donation has been updated successfully",
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error || !donation) {
    return (
      <Layout>
        <div className="container py-8">
          <h1 className="text-xl font-medium text-center text-muted-foreground">
            Donation not found or you do not have permission to view it
          </h1>
          <div className="flex justify-center mt-4">
            <Button onClick={() => navigate("/donor/donations")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Donations
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const getStatusBadgeColor = (status: Donation["status"]) => {
    switch (status) {
      case "listed":
        return "bg-blue-500";
      case "reserved":
        return "bg-yellow-500";
      case "pickedUp":
        return "bg-green-500";
      case "delivered":
        return "bg-green-700";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <Button 
          variant="outline" 
          onClick={() => navigate("/donor/donations")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Donations
        </Button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{donation.title}</h1>
          {donation.status === "listed" && (
            <Button onClick={handleEditToggle}>
              <Pencil className="mr-2 h-4 w-4" />
              {isEditing ? "Cancel Edit" : "Edit Donation"}
            </Button>
          )}
        </div>

        {isEditing ? (
          <DonationEditForm 
            donation={donation} 
            onDonationUpdated={handleDonationUpdated}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Donation Information</CardTitle>
                <div className="flex items-center mt-2">
                  <Badge className={getStatusBadgeColor(donation.status)}>
                    {donation.status === "listed" ? "Available" :
                     donation.status === "reserved" ? "Reserved" :
                     donation.status === "pickedUp" ? "Picked Up" : "Delivered"}
                  </Badge>
                  <span className="text-sm text-muted-foreground ml-4">
                    Created {format(new Date(donation.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Description</h3>
                  <p>{donation.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Food Type</h3>
                    <p>{donation.foodType}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Quantity</h3>
                    <p>{donation.quantity}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Expiry Date</h3>
                    <p>{format(new Date(donation.expiryDate), "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Storage</h3>
                    <p>{donation.storageRequirements}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pickup Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Pickup Address</h3>
                  <p>{donation.pickupAddress}</p>
                </div>
                {donation.pickupInstructions && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Pickup Instructions</h3>
                    <p>{donation.pickupInstructions}</p>
                  </div>
                )}
                {donation.status !== "listed" && donation.pickupTime && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Scheduled Pickup</h3>
                    <p>{format(new Date(donation.pickupTime), "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                )}
                {donation.reservedByName && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Reserved By</h3>
                    <p>{donation.reservedByName}</p>
                  </div>
                )}
                {donation.volunteerName && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Volunteer</h3>
                    <p>{donation.volunteerName}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
