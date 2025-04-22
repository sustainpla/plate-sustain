
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDonationUpdates } from "@/hooks/useDonationUpdates";
import DonationCard from "@/components/donations/DonationCard";

export default function Reservations() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const reservations = useDonationUpdates(currentUser?.id || "", "ngo");

  useEffect(() => {
    if (!currentUser || currentUser.role !== "ngo") {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">My Reservations</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>All Reserved Donations</CardTitle>
            <CardDescription>
              View and manage your reserved food donations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reservations?.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reservations.map((donation) => (
                  <DonationCard 
                    key={donation.id} 
                    donation={donation}
                    viewType="ngo"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">You haven't reserved any donations yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
