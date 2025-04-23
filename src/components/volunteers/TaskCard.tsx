
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock } from "lucide-react";
import { VolunteerTask } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: VolunteerTask;
  onAction?: (task: VolunteerTask) => void;
  actionLabel?: string;
}

export default function TaskCard({
  task,
  onAction,
  actionLabel,
}: TaskCardProps) {
  const statusMap = {
    available: "Available",
    assigned: "Assigned",
    pickedUp: "Picked Up",
    completed: "Completed",
  };

  const statusColorMap = {
    available: "bg-blue-100 text-blue-800",
    assigned: "bg-orange-100 text-orange-800",
    pickedUp: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
  };

  const formatPickupTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  const getActionLabel = () => {
    if (task.status === "available") return "Sign Up";
    if (task.status === "assigned") return "Mark as Picked Up";
    if (task.status === "pickedUp") return "Complete Delivery";
    return "View Details";
  };

  const getActionButtonStyle = () => {
    if (task.status === "available") {
      return "bg-sustainPlate-green hover:bg-sustainPlate-green-dark";
    }
    if (task.status === "completed") {
      return "bg-gray-400 cursor-not-allowed";
    }
    return "";
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {task.donationTitle}
          </CardTitle>
          <Badge 
            className={cn(
              statusColorMap[task.status],
              "font-normal"
            )}
          >
            {statusMap[task.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock size={16} className="text-sustainPlate-green" />
          <span>Pickup: {formatPickupTime(task.pickupTime)}</span>
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-start gap-2 text-sm">
            <MapPin size={16} className="text-sustainPlate-status-listed mt-1" />
            <div>
              <div className="font-semibold">Pickup from:</div>
              <div>{task.pickupAddress}</div>
            </div>
          </div>
          
          <div className="flex items-start gap-2 text-sm">
            <MapPin size={16} className="text-sustainPlate-status-delivered mt-1" />
            <div>
              <div className="font-semibold">Deliver to:</div>
              <div>{task.deliveryAddress}</div>
            </div>
          </div>
        </div>
      </CardContent>
      {onAction && (
        <CardFooter className="pt-0">
          <Button
            onClick={() => onAction(task)}
            variant="default"
            className={getActionButtonStyle()}
            disabled={task.status === "completed"}
          >
            {actionLabel || getActionLabel()}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
