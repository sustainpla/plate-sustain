
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskCard from "@/components/volunteers/TaskCard";
import { Calendar, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useVolunteerTasks } from "@/hooks/useVolunteerTasks";

export default function MySchedule() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!currentUser || currentUser.role !== "volunteer") {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const { 
    assignedTasks, 
    isLoadingAssigned, 
    refetchAssigned 
  } = useVolunteerTasks(currentUser?.id);

  const handleRefresh = () => {
    refetchAssigned();
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
            {isLoadingAssigned ? (
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
