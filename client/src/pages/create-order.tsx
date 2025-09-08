import { useState } from "react";
import { PlusCircle, User, Calendar, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { Service } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CreateOrder() {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const handleCreateOrder = () => {
    // Logic to create the order will go here
    console.log({
      customerName,
      customerPhone,
      selectedService,
      pickupDate,
      specialInstructions,
    });
    setIsModalOpen(true);
  };

  const selectedServiceDetails = services?.find(s => s.id === selectedService);

  return (
    <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create New Order</h1>
        <Button onClick={handleCreateOrder}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Save Order
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Customer and Service Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Name</Label>
                <Input
                    id="customerName"
                    placeholder="Enter customer's full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                    id="customerPhone"
                    placeholder="Enter customer's phone number"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Service &amp; Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Service</Label>
                <Select onValueChange={setSelectedService} value={selectedService}>
                    <SelectTrigger>
                    <SelectValue placeholder="Select a service..." />
                    </SelectTrigger>
                    <SelectContent>
                    {servicesLoading ? (
                        <SelectItem value="loading" disabled>Loading services...</SelectItem>
                    ) : (
                        services?.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                            {service.name} - ₹{service.price}
                        </SelectItem>
                        ))
                    )}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupDate">Pickup Date</Label>
                <Input
                    id="pickupDate"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <Textarea
                    id="specialInstructions"
                    placeholder="e.g., gate code, specific drop-off location"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Service</span>
                <span>{selectedServiceDetails ? selectedServiceDetails.name : "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Price</span>
                <span>{selectedServiceDetails ? `₹${parseFloat(selectedServiceDetails.price).toFixed(2)}` : "₹0.00"}</span>
              </div>
              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{selectedServiceDetails ? `₹${parseFloat(selectedServiceDetails.price).toFixed(2)}` : "₹0.00"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Order Created Successfully!</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <p>Your new order has been created and saved.</p>
                <Button onClick={() => setIsModalOpen(false)} className="mt-4">Close</Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
