
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskCard from "@/components/volunteers/TaskCard";
import { VolunteerTask } from "@/lib/types";
import { Loader2, Calendar, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function MySchedule() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!currentUser || currentUser.role !== "volunteer") {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // Fetch volunteer's assigned tasks
  const { data: assignedTasks, isLoading, refetch } = useQuery({
    queryKey: ["volunteer-tasks", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) throw new Error("User not authenticated");
      
      console.log("Fetching assigned tasks for volunteer:", currentUser.id);
      
      const { data, error } = await supabase
        .from("donations")
        .select(`
          id,
          title,
          pickup_address,
          pickup_time,
          status,
          profiles!donations_donor_id_fkey(name, address),
          profiles!donations_reserved_by_fkey(name, address)
        `)
        .eq("volunteer_id", currentUser.id)
        .order("pickup_time", { ascending: true });

      if (error) {
        console.error("Error fetching volunteer tasks:", error);
        toast({
          title: "Error fetching assigned tasks",
          description: "Could not load your tasks. Please refresh the page.",
          variant: "destructive",
        });
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} tasks for volunteer ${currentUser.id}:`, data);
      
      if (!data) return [];
      
      // Map the database response to match our VolunteerTask type
      return data.map(item => ({
        id: item.id,
        donationId: item.id,
        donationTitle: item.title,
        pickupAddress: item.pickup_address,
        deliveryAddress: item.profiles?.address || "Contact NGO for address",
        pickupTime: item.pickup_time || new Date().toISOString(),
        status: "assigned" as const,
        volunteerId: currentUser.id,
        volunteerName: currentUser.name,
      })) as VolunteerTask[];
    },
    enabled: !!currentUser?.id,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing schedule",
      description: "Getting the latest tasks...",
    });
  };

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">My Schedule</h1>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Scheduled Deliveries</CardTitle>
              <CardDescription>
                Your upcoming and past delivery tasks
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading your schedule...</p>
              </div>
            ) : assignedTasks && assignedTasks.length > 0 ? (
              <Tabs defaultValue="upcoming">
                <TabsList className="mb-4">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assignedTasks
                      .filter(task => new Date(task.pickupTime) > new Date())
                      .map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          onAction={() => navigate(`/volunteer/task/${task.id}`)}
                          actionLabel="View Details"
                        />
                      ))}
                  </div>
                  {assignedTasks.filter(task => new Date(task.pickupTime) > new Date()).length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No upcoming deliveries scheduled</p>
                      <Button 
                        onClick={() => navigate("/volunteer/available-tasks")}
                        variant="outline"
                        className="mt-4"
                      >
                        Find Available Tasks
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="past">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assignedTasks
                      .filter(task => new Date(task.pickupTime) <= new Date())
                      .map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          onAction={() => navigate(`/volunteer/task/${task.id}`)}
                          actionLabel="View Details"
                        />
                      ))}
                  </div>
                  {assignedTasks.filter(task => new Date(task.pickupTime) <= new Date()).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No past deliveries</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">You don't have any scheduled deliveries yet</p>
                <Button 
                  onClick={() => navigate("/volunteer/available-tasks")}
                  className="mt-4"
                >
                  Find Available Tasks
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
