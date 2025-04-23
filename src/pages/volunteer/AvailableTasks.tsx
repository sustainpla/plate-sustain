
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TaskCard from "@/components/volunteers/TaskCard";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useVolunteerTasks } from "@/hooks/useVolunteerTasks";

export default function AvailableTasks() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!currentUser || currentUser.role !== "volunteer") {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const { 
    availableTasks: tasks, 
    isLoadingAvailable: isLoading, 
    refetchAvailable: refetch 
  } = useVolunteerTasks(currentUser?.id);

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing tasks",
      description: "Getting the latest available tasks...",
    });
  };

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Available Delivery Tasks</h1>
        
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Volunteer Opportunities</CardTitle>
                <CardDescription>
                  Help deliver food from donors to NGOs in need
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading available tasks...</p>
              </div>
            ) : tasks.length > 0 ? (
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
