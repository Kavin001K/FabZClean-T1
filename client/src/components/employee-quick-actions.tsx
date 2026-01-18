import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import {
  Clock,
  Calendar as CalendarIcon,
  Timer,
  FileText,
  User,
  DollarSign,
  MapPin,
  Truck,
  CheckCircle,
  AlertCircle,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EmployeeQuickActionsProps {
  employeeId: string;
  employeeName: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'half_day';
}

interface TimeOffRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'sick' | 'personal' | 'vacation' | 'emergency';
}

export default function DashboardQuickActions({ employeeId, employeeName }: EmployeeQuickActionsProps) {
  const { toast } = useToast();
  const { addNotification } = useNotifications();

  // State for different actions
  const [isClockDialogOpen, setIsClockDialogOpen] = useState(false);
  const [isTimeOffDialogOpen, setIsTimeOffDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isPayslipDialogOpen, setIsPayslipDialogOpen] = useState(false);

  // Attendance state
  const [currentStatus, setCurrentStatus] = useState<'checked_in' | 'checked_out' | 'on_break'>('checked_out');
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [breakStartTime, setBreakStartTime] = useState<string | null>(null);

  // Time off request state
  const [timeOffForm, setTimeOffForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'personal' as 'sick' | 'personal' | 'vacation' | 'emergency'
  });

  // Report state
  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  // Profile state
  const [profileForm, setProfileForm] = useState({
    phone: '',
    email: '',
    address: '',
    emergencyContact: ''
  });

  // Clock In/Out functionality
  const handleClockAction = () => {
    const now = new Date().toISOString();

    if (currentStatus === 'checked_out') {
      setCurrentStatus('checked_in');
      setCheckInTime(now);
      addNotification({
        type: 'success',
        title: 'Checked In Successfully!',
        message: `Welcome ${employeeName}! You're now clocked in.`,
        actionUrl: '/employee-dashboard',
        actionText: 'View Dashboard'
      });
      toast({
        title: "Checked In",
        description: `You checked in at ${new Date().toLocaleTimeString()}`,
      });
    } else if (currentStatus === 'checked_in') {
      setCurrentStatus('checked_out');
      setCheckInTime(null);
      addNotification({
        type: 'info',
        title: 'Checked Out',
        message: `Good work today, ${employeeName}! Have a great day.`,
      });
      toast({
        title: "Checked Out",
        description: `You checked out at ${new Date().toLocaleTimeString()}`,
      });
    }
    setIsClockDialogOpen(false);
  };

  // Break functionality
  const handleBreakAction = () => {
    const now = new Date().toISOString();

    if (currentStatus === 'checked_in') {
      setCurrentStatus('on_break');
      setBreakStartTime(now);
      toast({
        title: "Break Started",
        description: "Enjoy your break!",
      });
    } else if (currentStatus === 'on_break') {
      setCurrentStatus('checked_in');
      setBreakStartTime(null);
      toast({
        title: "Break Ended",
        description: "Welcome back to work!",
      });
    }
  };

  // Time off request
  const handleTimeOffRequest = () => {
    if (!timeOffForm.startDate || !timeOffForm.endDate || !timeOffForm.reason) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const request: TimeOffRequest = {
      id: `req-${Date.now()}`,
      employeeId,
      startDate: timeOffForm.startDate,
      endDate: timeOffForm.endDate,
      reason: timeOffForm.reason,
      status: 'pending',
      type: timeOffForm.type
    };

    // Simulate API call
    setTimeout(() => {
      addNotification({
        type: 'success',
        title: 'Time Off Request Submitted!',
        message: `Your ${timeOffForm.type} leave request has been submitted for approval.`,
        actionUrl: '/employee-dashboard',
        actionText: 'View Status'
      });
      toast({
        title: "Request Submitted",
        description: "Your time off request has been sent for approval.",
      });
      setIsTimeOffDialogOpen(false);
      setTimeOffForm({ startDate: '', endDate: '', reason: '', type: 'personal' });
    }, 1000);
  };

  // Submit report
  const handleReportSubmit = () => {
    if (!reportForm.title || !reportForm.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in title and description.",
        variant: "destructive",
      });
      return;
    }

    addNotification({
      type: 'success',
      title: 'Report Submitted!',
      message: `Your ${reportForm.priority} priority report has been submitted.`,
      actionUrl: '/employee-dashboard',
      actionText: 'View Reports'
    });

    toast({
      title: "Report Submitted",
      description: "Your report has been sent to management.",
    });

    setIsReportDialogOpen(false);
    setReportForm({ title: '', description: '', priority: 'medium' });
  };

  // Update profile
  const handleProfileUpdate = () => {
    addNotification({
      type: 'success',
      title: 'Profile Updated!',
      message: "Your profile information has been updated successfully.",
    });

    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });

    setIsProfileDialogOpen(false);
  };

  // Get current time display
  const getCurrentTimeDisplay = () => {
    if (currentStatus === 'checked_in' && checkInTime) {
      const checkIn = new Date(checkInTime);
      const now = new Date();
      const hours = Math.floor((now.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
      const minutes = Math.floor(((now.getTime() - checkIn.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
    return '0h 0m';
  };

  const quickActions = [
    {
      label: currentStatus === 'checked_out' ? "Clock In" : currentStatus === 'on_break' ? "End Break" : "Clock Out",
      icon: Clock,
      action: () => setIsClockDialogOpen(true),
      variant: (currentStatus === 'checked_in' ? "destructive" : "default") as "destructive" | "default",
      badge: currentStatus !== 'checked_out' ? getCurrentTimeDisplay() : undefined
    },
    {
      label: "Request Time Off",
      icon: CalendarIcon,
      action: () => setIsTimeOffDialogOpen(true),
      variant: "outline" as const
    },
    {
      label: "View Schedule",
      icon: Timer,
      action: () => {
        toast({
          title: "Schedule View",
          description: "Opening your work schedule...",
        });
      },
      variant: "outline" as const
    },
    {
      label: "Submit Report",
      icon: FileText,
      action: () => setIsReportDialogOpen(true),
      variant: "outline" as const
    },
    {
      label: "Update Profile",
      icon: User,
      action: () => setIsProfileDialogOpen(true),
      variant: "outline" as const
    },
    {
      label: "View Payslip",
      icon: DollarSign,
      action: () => setIsPayslipDialogOpen(true),
      variant: "outline" as const
    }
  ];

  return (
    <div className="space-y-4">
      {/* Current Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                className="h-auto p-4 flex flex-col items-center space-y-2 relative"
                onClick={action.action}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-xs text-center">{action.label}</span>
                {action.badge && (
                  <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs">
                    {action.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clock In/Out Dialog */}
      <Dialog open={isClockDialogOpen} onOpenChange={setIsClockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {currentStatus === 'checked_out' ? 'Clock In' : 'Clock Out'}
            </DialogTitle>
            <DialogDescription>
              {currentStatus === 'checked_out' ? 'Start your work day' : 'End your work day and clock out'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Current Status</p>
              <p className="text-lg font-semibold capitalize">
                {currentStatus === 'checked_out' ? 'Not Working' :
                  currentStatus === 'on_break' ? 'On Break' : 'Working'}
              </p>
              {checkInTime && (
                <p className="text-sm text-muted-foreground mt-2">
                  Since: {new Date(checkInTime).toLocaleTimeString()}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleClockAction} className="flex-1">
                {currentStatus === 'checked_out' ? 'Clock In' : 'Clock Out'}
              </Button>
              {(currentStatus === 'checked_in' || currentStatus === 'on_break') && (
                <Button variant="outline" onClick={handleBreakAction}>
                  {currentStatus === 'on_break' ? 'End Break' : 'Start Break'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Off Request Dialog */}
      <Dialog open={isTimeOffDialogOpen} onOpenChange={setIsTimeOffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Request Time Off
            </DialogTitle>
            <DialogDescription>
              Submit a time off request for sick leave, vacation, or personal time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !timeOffForm.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {timeOffForm.startDate ? format(new Date(timeOffForm.startDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={timeOffForm.startDate ? new Date(timeOffForm.startDate) : undefined}
                      onSelect={(date) => setTimeOffForm({ ...timeOffForm, startDate: date ? date.toISOString().split('T')[0] : '' })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !timeOffForm.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {timeOffForm.endDate ? format(new Date(timeOffForm.endDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={timeOffForm.endDate ? new Date(timeOffForm.endDate) : undefined}
                      onSelect={(date) => setTimeOffForm({ ...timeOffForm, endDate: date ? date.toISOString().split('T')[0] : '' })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Leave Type</Label>
              <Select value={timeOffForm.type} onValueChange={(value: any) => setTimeOffForm({ ...timeOffForm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal Leave</SelectItem>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for your leave request..."
                value={timeOffForm.reason}
                onChange={(e) => setTimeOffForm({ ...timeOffForm, reason: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleTimeOffRequest} className="flex-1">
                Submit Request
              </Button>
              <Button variant="outline" onClick={() => setIsTimeOffDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Submit Report
            </DialogTitle>
            <DialogDescription>
              Submit a work report or issue to management.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reportTitle">Report Title</Label>
              <Input
                id="reportTitle"
                placeholder="Enter report title..."
                value={reportForm.title}
                onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={reportForm.priority} onValueChange={(value: any) => setReportForm({ ...reportForm, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportDescription">Description</Label>
              <Textarea
                id="reportDescription"
                placeholder="Describe your report in detail..."
                value={reportForm.description}
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleReportSubmit} className="flex-1">
                Submit Report
              </Button>
              <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Update Profile
            </DialogTitle>
            <DialogDescription>
              Update your contact information and profile details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="Enter your phone number..."
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address..."
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter your address..."
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                placeholder="Emergency contact name and phone..."
                value={profileForm.emergencyContact}
                onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleProfileUpdate} className="flex-1">
                Update Profile
              </Button>
              <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Payslip Dialog */}
      <Dialog open={isPayslipDialogOpen} onOpenChange={setIsPayslipDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pay Slip - September 2024
            </DialogTitle>
            <DialogDescription>
              View your monthly payslip details and download PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Employee</p>
                <p className="font-semibold">{employeeName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="font-semibold">{employeeId}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Basic Salary</span>
                <span>₹45,000</span>
              </div>
              <div className="flex justify-between">
                <span>Overtime (8 hours)</span>
                <span>₹1,800</span>
              </div>
              <div className="flex justify-between">
                <span>Performance Bonus</span>
                <span>₹2,500</span>
              </div>
              <div className="flex justify-between">
                <span>Transport Allowance</span>
                <span>₹1,000</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Gross Salary</span>
                <span>₹50,300</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Tax Deduction</span>
                <span>-₹5,030</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Provident Fund</span>
                <span>-₹2,250</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Net Salary</span>
                <span>₹43,020</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1">
                Download PDF
              </Button>
              <Button variant="outline" onClick={() => setIsPayslipDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
