
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TaskCard from "@/components/volunteers/TaskCard";
import { VolunteerTask } from "@/lib/types";

export default function AvailableTasks() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || currentUser.role !== "volunteer") {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["available-tasks"],
    queryFn: async () => {
      // Get all reserved donations that don't have a volunteer assigned
      const { data, error } = await supabase
        .from("donations")
        .select(`
          id,
          title,
          pickup_address,
          pickup_time,
          profiles!donations_donor_id_fkey(name, address),
          profiles!donations_reserved_by_fkey(name, address)
        `)
        .eq("status", "reserved")
        .is("volunteer_id", null);

      if (error) throw error;
      
      // Map the database response to match our VolunteerTask type
      return data.map(item => ({
        id: item.id,
        donationId: item.id,
        donationTitle: item.title,
        pickupAddress: item.pickup_address,
        deliveryAddress: item.profiles?.address || "Contact NGO for address",
        pickupTime: item.pickup_time || new Date().toISOString(),
        status: "available",
        volunteerId: undefined,
        volunteerName: undefined
      }));
    },
    enabled: !!currentUser?.id,
  });

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Available Delivery Tasks</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Volunteer Opportunities</CardTitle>
            <CardDescription>
              Help deliver food from donors to NGOs in need
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : tasks?.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task}
                    onAction={() => navigate(`/volunteer/task/${task.id}`)}
                    actionLabel="Sign Up"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No available tasks at the moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
