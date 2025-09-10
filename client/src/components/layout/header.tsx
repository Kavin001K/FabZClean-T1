import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun, User, Menu, Search, Bell, Settings, Command, Maximize2, Minimize2, Square } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, DollarSign, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

interface HeaderProps {
  onSidebarToggle: () => void;
}

export default function Header({ onSidebarToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState(3);

  // Desktop keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'k':
            event.preventDefault();
            // Focus global search
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            searchInput?.focus();
            break;
          case 'b':
            event.preventDefault();
            // Toggle sidebar
            onSidebarToggle();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSidebarToggle]);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Success!",
      description: "Your password has been changed successfully.",
    });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 desktop-optimized">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={onSidebarToggle}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        
        {/* Desktop Global Search */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search anything... (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80 pl-10 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary desktop-search"
            />
          </div>
        </div>
        
        <h1 className="text-xl font-bold desktop-only">Dashboard</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Desktop Status Info */}
        <div className="text-right hidden lg:block">
          <p className="text-xs text-muted-foreground">Last updated</p>
          <p className="text-sm font-medium">2 minutes ago</p>
        </div>
        
        {/* Desktop Notifications */}
        <div className="hidden lg:flex items-center gap-2">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {notifications}
              </Badge>
            )}
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="desktop-button"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center cursor-pointer">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>My Profile</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <div className="flex items-center gap-6 animate-fade-in">
                <Avatar className="h-24 w-24 border-4 border-primary">
                  <AvatarImage src="/avatars/01.png" alt="User" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">John Doe</h2>
                  <p className="text-muted-foreground">Super Admin</p>
                  <Badge>Active</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>john.doe@fabzclean.com</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p>+91 98765 43210</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Joining Date</p>
                    <p>January 15, 2022</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p>Headquarters</p>
                </div>
              </div>
              <Tabs defaultValue="attendance" className="animate-fade-in" style={{ animationDelay: "200ms" }}>
                <TabsList>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="payouts">Payouts</TabsTrigger>
                </TabsList>
                <TabsContent value="attendance">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Input placeholder="Search logs..." className="flex-1" />
                      <Select>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="leave">Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>2023-06-25</TableCell>
                          <TableCell><Badge variant="default">Present</Badge></TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>2023-06-24</TableCell>
                          <TableCell><Badge variant="destructive">Absent</Badge></TableCell>
                          <TableCell>Unplanned</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>2023-06-23</TableCell>
                          <TableCell><Badge variant="secondary">Leave</Badge></TableCell>
                          <TableCell>Sick Leave</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="payouts">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Input placeholder="Search payouts..." className="flex-1" />
                      <Select>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>July 1, 2023</TableCell>
                          <TableCell>₹50,000</TableCell>
                          <TableCell><Badge variant="default">Completed</Badge></TableCell>
                          <TableCell>PAY-2023-07-001</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>June 1, 2023</TableCell>
                          <TableCell>₹48,500</TableCell>
                          <TableCell><Badge variant="default">Completed</Badge></TableCell>
                          <TableCell>PAY-2023-06-001</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>May 1, 2023</TableCell>
                          <TableCell>₹50,000</TableCell>
                          <TableCell><Badge variant="default">Completed</Badge></TableCell>
                          <TableCell>PAY-2023-05-001</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
              <Collapsible className="animate-fade-in" style={{ animationDelay: "300ms" }}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline">Change Password</Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="py-4 space-y-4">
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" required />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" required />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" required />
                    </div>
                    <Button type="submit">Save Changes</Button>
                  </form>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
