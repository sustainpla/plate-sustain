
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Donation } from "@/lib/types";

const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  foodType: z.string().min(1, { message: "Please select a food type" }),
  quantity: z.string().min(1, { message: "Please provide quantity information" }),
  expiryDate: z.string().min(1, { message: "Please provide expiry date" }),
  storageRequirements: z.string().min(1, { message: "Please provide storage requirements" }),
  pickupAddress: z.string().min(5, { message: "Please provide pickup address" }),
  pickupInstructions: z.string().optional(),
});

interface DonationFormProps {
  onDonationCreated?: (donation: Donation) => void;
}

export default function DonationForm({ onDonationCreated }: DonationFormProps) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      foodType: "",
      quantity: "",
      expiryDate: new Date().toISOString().split("T")[0],
      storageRequirements: "",
      pickupAddress: currentUser?.address || "",
      pickupInstructions: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please login to create a donation",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const newDonation: Donation = {
        id: `d${Math.floor(Math.random() * 1000)}`,
        donorId: currentUser.id,
        donorName: currentUser.name,
        title: values.title,
        description: values.description,
        foodType: values.foodType,
        quantity: values.quantity,
        expiryDate: values.expiryDate,
        storageRequirements: values.storageRequirements,
        pickupAddress: values.pickupAddress,
        pickupInstructions: values.pickupInstructions,
        status: "listed",
        createdAt: new Date().toISOString(),
      };

      toast({
        title: "Donation created",
        description: "Your food donation has been listed successfully",
      });

      if (onDonationCreated) {
        onDonationCreated(newDonation);
      } else {
        navigate("/donor/donations");
      }
    } catch (error) {
      toast({
        title: "Error creating donation",
        description: "There was an error creating your donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Fresh Bread and Pastries" {...field} />
              </FormControl>
              <FormDescription>
                A short title describing the food donation
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide more details about the food donation"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Include details about the food items and any relevant information
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="foodType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Food Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select food type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Prepared Food">Prepared Food</SelectItem>
                    <SelectItem value="Fresh Produce">Fresh Produce</SelectItem>
                    <SelectItem value="Bakery Items">Bakery Items</SelectItem>
                    <SelectItem value="Canned Goods">Canned Goods</SelectItem>
                    <SelectItem value="Dairy Products">Dairy Products</SelectItem>
                    <SelectItem value="Meat/Protein">Meat/Protein</SelectItem>
                    <SelectItem value="Mixed Items">Mixed Items</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., 5kg, Serves 10 people"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="storageRequirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Requirements</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select storage requirements" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Room temperature">Room temperature</SelectItem>
                    <SelectItem value="Refrigeration required">Refrigeration required</SelectItem>
                    <SelectItem value="Freezing required">Freezing required</SelectItem>
                    <SelectItem value="Cool, dry place">Cool, dry place</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="pickupAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pickup Address</FormLabel>
              <FormControl>
                <Input placeholder="Full address for pickup" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pickupInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pickup Instructions (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any specific instructions for pickup"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Include parking information, entry details, or contact person
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full md:w-auto bg-sustainPlate-green hover:bg-sustainPlate-green-dark"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating donation...
            </>
          ) : (
            "Create Donation"
          )}
        </Button>
      </form>
    </Form>
  );
}
