
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import TaskCard from "@/components/volunteers/TaskCard";
import { Search, ChevronRight, Calendar, Clock, CheckCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export default function VolunteerDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch available tasks (reserved donations without volunteer)
  const { data: availableTasks, isLoading: loadingAvailable } = useQuery({
    queryKey: ["available-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select(`
          id,
          title,
          pickup_address,
          pickup_time,
          status,
          profiles!donations_donor_id_fkey(name),
          profiles!donations_reserved_by_fkey(name, address)
        `)
        .eq("status", "reserved")
        .is("volunteer_id", null);

      if (error) {
        console.error("Error fetching available tasks:", error);
        throw error;
      }
      
      console.log("Available tasks data:", data);
      
      return data?.map(item => ({
        id: item.id,
        donationId: item.id,
        donationTitle: item.title,
        pickupAddress: item.pickup_address,
        deliveryAddress: item.profiles?.address || "Contact NGO for address",
        pickupTime: item.pickup_time || new Date().toISOString(),
        status: "available" as const,
        volunteerId: undefined,
        volunteerName: undefined
      }));
    },
    enabled: !!currentUser?.id,
  });

  // Fetch assigned tasks
  const { data: assignedTasks, isLoading: loadingAssigned } = useQuery({
    queryKey: ["assigned-tasks", currentUser?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select(`
          id,
          title,
          pickup_address,
          pickup_time,
          status,
          profiles!donations_donor_id_fkey(name),
          profiles!donations_reserved_by_fkey(name, address)
        `)
        .eq("volunteer_id", currentUser?.id);

      if (error) {
        console.error("Error fetching assigned tasks:", error);
        throw error;
      }
      
      console.log("Assigned tasks data:", data);
      
      return data?.map(item => ({
        id: item.id,
        donationId: item.id,
        donationTitle: item.title,
        pickupAddress: item.pickup_address,
        deliveryAddress: item.profiles?.address || "Contact NGO for address",
        pickupTime: item.pickup_time || new Date().toISOString(),
        status: item.status === "pickedUp" ? "pickedUp" as const : 
               item.status === "delivered" ? "completed" as const : 
               "assigned" as const,
        volunteerId: currentUser?.id,
        volunteerName: currentUser?.name
      }));
    },
    enabled: !!currentUser?.id,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!currentUser?.id) return;

    // Subscribe to changes for available tasks
    const availableChannel = supabase
      .channel('available-tasks-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'donations',
          filter: 'status=eq.reserved'
        }, 
        (payload) => {
          console.log("Real-time update for available tasks:", payload);
          queryClient.invalidateQueries({ queryKey: ["available-tasks"] });
        }
      )
      .subscribe();

    // Subscribe to changes for assigned tasks
    const assignedChannel = supabase
      .channel('assigned-tasks-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'donations',
          filter: `volunteer_id=eq.${currentUser.id}` 
        }, 
        (payload) => {
          console.log("Real-time update for assigned tasks:", payload);
          queryClient.invalidateQueries({ queryKey: ["assigned-tasks", currentUser.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(availableChannel);
      supabase.removeChannel(assignedChannel);
    };
  }, [currentUser?.id, queryClient]);

  const stats = {
    total: assignedTasks?.length || 0,
    upcoming: assignedTasks?.filter(t => t.status === "assigned" || t.status === "pickedUp").length || 0,
    completed: assignedTasks?.filter(t => t.status === "completed").length || 0,
  };

  const getRecentAvailableTasks = () => {
    return availableTasks?.slice(0, 3) || [];
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Volunteer Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your delivery tasks and find available opportunities
            </p>
          </div>
          <Button 
            onClick={() => navigate("/volunteer/available-tasks")}
            className="mt-4 md:mt-0 bg-sustainPlate-green hover:bg-sustainPlate-green-dark"
          >
            <Search size={16} className="mr-2" />
            Find Tasks
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="flex flex-row items-center p-6">
              <Calendar size={40} className="text-sustainPlate-green mr-4" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-row items-center p-6">
              <div className="rounded-full bg-sustainPlate-status-reserved/20 p-2 mr-4">
                <Clock size={24} className="text-sustainPlate-status-reserved" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                <h3 className="text-2xl font-bold">{stats.upcoming}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-row items-center p-6">
              <div className="rounded-full bg-sustainPlate-status-delivered/20 p-2 mr-4">
                <CheckCircle size={24} className="text-sustainPlate-status-delivered" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <h3 className="text-2xl font-bold">{stats.completed}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Available Tasks */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Available Tasks</CardTitle>
            <CardDescription>
              Food delivery opportunities in your area
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableTasks?.length > 0 ? (
              <div className="space-y-4">
                {getRecentAvailableTasks().map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onAction={() => navigate(`/volunteer/task/${task.id}`)}
                    actionLabel="Sign Up"
                  />
                ))}
                {availableTasks?.length > 3 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate("/volunteer/available-tasks")}
                  >
                    View All Available Tasks
                    <ChevronRight size={16} className="ml-2" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No available tasks at the moment</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Your Tasks</CardTitle>
            <CardDescription>
              Tasks you're assigned to and completed deliveries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="assigned">Assigned</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                {assignedTasks?.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assignedTasks.map((task) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onAction={() => navigate(`/volunteer/task/${task.id}`)}
                        actionLabel={task.status === "assigned" ? "Update Status" : "View Details"}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No assigned tasks found</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="assigned">
                {assignedTasks?.filter(t => t.status === "assigned").length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assignedTasks
                      .filter(t => t.status === "assigned")
                      .map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          onAction={() => navigate(`/volunteer/task/${task.id}`)}
                          actionLabel="Update Status"
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No upcoming tasks found</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="completed">
                {assignedTasks?.filter(t => t.status === "completed").length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assignedTasks
                      .filter(t => t.status === "completed")
                      .map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          onAction={() => navigate(`/volunteer/task/${task.id}`)}
                          actionLabel="View Details"
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No completed tasks found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
