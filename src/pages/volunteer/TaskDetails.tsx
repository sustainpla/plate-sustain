
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Donation } from "@/lib/types";
import { AlertCircle, Clock, Loader2, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false);
  
  useEffect(() => {
    if (!currentUser || currentUser.role !== "volunteer") {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // Fetch the donation details
  const { data: task, isLoading: isLoadingTask, refetch } = useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      if (!id) throw new Error("No task ID provided");
      
      const { data, error } = await supabase
        .from("donations")
        .select(`
          *,
          donor:profiles!donations_donor_id_fkey(name),
          ngo:profiles!donations_reserved_by_fkey(name, address)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        donorId: data.donor_id,
        donorName: data.donor?.name || "Unknown donor",
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
        reservedByName: data.ngo?.name || "Unknown NGO",
        deliveryAddress: data.ngo?.address || "Please contact the NGO for address details",
        pickupTime: data.pickup_time || new Date().toISOString(),
        volunteerId: data.volunteer_id || undefined,
        volunteerName: undefined, // Will be filled in if the volunteer is assigned
      };
    },
    enabled: !!id && !!currentUser?.id,
  });

  // Real-time updates for this task
  useEffect(() => {
    if (!id) return;
    
    const channel = supabase
      .channel(`task-${id}-changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'donations',
          filter: `id=eq.${id}`
        }, 
        (payload) => {
          console.log("Real-time update for task:", payload);
          refetch();
          queryClient.invalidateQueries({ queryKey: ["available-tasks"] });
          queryClient.invalidateQueries({ queryKey: ["assigned-tasks"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refetch, queryClient]);

  // Assignment function
  const assignTask = async () => {
    if (!currentUser?.id || !id) return;
    
    try {
      const { data, error } = await supabase
        .from("donations")
        .update({
          volunteer_id: currentUser.id,
          status: "pickedUp"
        })
        .eq("id", id)
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: "Task assigned",
        description: "You've successfully picked up this delivery task!",
      });
      
      // Refresh all relevant queries
      queryClient.invalidateQueries({ queryKey: ["task", id] });
      queryClient.invalidateQueries({ queryKey: ["available-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["assigned-tasks"] });
      
      navigate("/volunteer/dashboard");
    } catch (error: any) {
      console.error("Error assigning task:", error);
      toast({
        title: "Error assigning task",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAssignDialogOpen(false);
    }
  };

  // Function to mark a task as delivered (complete)
  const completeTask = async () => {
    if (!currentUser?.id || !id) return;
    
    try {
      const { data, error } = await supabase
        .from("donations")
        .update({
          status: "delivered"
        })
        .eq("id", id)
        .eq("volunteer_id", currentUser.id)
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: "Delivery completed",
        description: "Thank you for completing this delivery!",
      });
      
      // Refresh all relevant queries
      queryClient.invalidateQueries({ queryKey: ["task", id] });
      queryClient.invalidateQueries({ queryKey: ["available-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["assigned-tasks"] });
      
      navigate("/volunteer/dashboard");
    } catch (error: any) {
      console.error("Error completing task:", error);
      toast({
        title: "Error completing task",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUpdateStatusDialogOpen(false);
    }
  };

  if (isLoadingTask) {
    return (
      <Layout>
        <div className="container py-8 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="container py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Task not found</h2>
                <p className="text-muted-foreground mb-4">
                  The task you are looking for does not exist or has been removed.
                </p>
                <Button onClick={() => navigate("/volunteer/available-tasks")}>
                  Back to Available Tasks
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const isAssigned = task.volunteerId === currentUser?.id;
  const canComplete = isAssigned && task.status === "pickedUp";
  const isCompleted = task.status === "delivered";
  const canAssign = !isAssigned && task.status === "reserved" && !task.volunteerId;
  
  const formatPickupTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString();
  };

  return (
    <Layout>
      <div className="container py-8">
        <Button
          variant="outline"
          onClick={() => navigate("/volunteer/dashboard")}
          className="mb-6"
        >
          Back to Dashboard
        </Button>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <CardTitle className="text-2xl">{task.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Food donation by {task.donorName}
                </p>
              </div>
              <Badge 
                className={
                  task.status === "reserved" ? "bg-blue-100 text-blue-800" :
                  task.status === "pickedUp" ? "bg-yellow-100 text-yellow-800" :
                  "bg-green-100 text-green-800"
                }
              >
                {task.status === "reserved" ? "Available" : 
                 task.status === "pickedUp" ? "In Progress" : 
                 "Delivered"}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Delivery Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-slate-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Pickup Time</p>
                    <p>{formatPickupTime(task.pickupTime)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Pickup Location</p>
                    <p>{task.pickupAddress}</p>
                    {task.pickupInstructions && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.pickupInstructions}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Delivery Location</p>
                    <p>{task.deliveryAddress}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Deliver to: {task.reservedByName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Food Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Type</p>
                  <p>{task.foodType}</p>
                </div>
                <div>
                  <p className="font-medium">Quantity</p>
                  <p>{task.quantity}</p>
                </div>
                <div>
                  <p className="font-medium">Storage</p>
                  <p>{task.storageRequirements}</p>
                </div>
                <div>
                  <p className="font-medium">Expires</p>
                  <p>{new Date(task.expiryDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            {canAssign && (
              <Button 
                onClick={() => setAssignDialogOpen(true)} 
                className="bg-sustainPlate-green hover:bg-sustainPlate-green-dark w-full"
              >
                Assign Me to This Task
              </Button>
            )}
            
            {canComplete && (
              <Button 
                onClick={() => setUpdateStatusDialogOpen(true)} 
                className="bg-sustainPlate-green hover:bg-sustainPlate-green-dark w-full"
              >
                Mark as Delivered
              </Button>
            )}
            
            {isCompleted && (
              <Button disabled className="w-full">
                Task Completed
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      
      {/* Assignment confirmation dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Task Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to assign yourself to this delivery task? You will be responsible for picking up the food from {task.donorName} and delivering it to {task.reservedByName}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={assignTask} className="bg-sustainPlate-green hover:bg-sustainPlate-green-dark">
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Completion confirmation dialog */}
      <Dialog open={updateStatusDialogOpen} onOpenChange={setUpdateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delivery Completion</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this task as delivered? This will complete the task and notify both the donor and the NGO.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={completeTask} className="bg-sustainPlate-green hover:bg-sustainPlate-green-dark">
              Confirm Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
