
import Layout from "@/components/Layout";
import DonationForm from "@/components/donations/DonationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Donation } from "@/lib/types";

export default function CreateDonation() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || currentUser.role !== "donor") {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleDonationCreated = (donation: Donation) => {
    navigate("/donor/donations");
  };

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Create a Donation</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Donation Details</CardTitle>
                <CardDescription>
                  Provide information about the food you want to donate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DonationForm onDonationCreated={handleDonationCreated} />
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Donation Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Food Quality</h3>
                  <p className="text-sm text-muted-foreground">
                    Ensure all food is safe for consumption and properly stored.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Packaging</h3>
                  <p className="text-sm text-muted-foreground">
                    Please package food securely to maintain quality during transport.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Expiry Dates</h3>
                  <p className="text-sm text-muted-foreground">
                    Be accurate with expiry dates to ensure timely distribution.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Pickup Details</h3>
                  <p className="text-sm text-muted-foreground">
                    Provide clear pickup instructions to help volunteers.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  1. Your donation will be listed for NGOs to browse.
                </p>
                <p className="text-sm text-muted-foreground">
                  2. An NGO can reserve your donation.
                </p>
                <p className="text-sm text-muted-foreground">
                  3. A volunteer will be assigned for pickup.
                </p>
                <p className="text-sm text-muted-foreground">
                  4. You'll receive notifications at each step.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
