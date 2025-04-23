
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import ReservationsDisplay from "@/components/ngo/ReservationsDisplay";
import { useMyReservations } from "@/hooks/useMyReservations";

export default function MyReservations() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || currentUser.role !== "ngo") {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const { data: reservations, isLoading } = useMyReservations(currentUser?.id);

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">My Reservations</h1>
        <ReservationsDisplay reservations={reservations} isLoading={isLoading} />
      </div>
    </Layout>
  );
}
