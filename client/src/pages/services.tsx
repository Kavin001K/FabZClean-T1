import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Plus, Shirt, AlertTriangle, CheckCircle, Brain, TrendingUp, Zap, Target, BarChart3, Clock, Settings } from "lucide-react";
import { formatCurrency } from "@/lib/data";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: string;
  status: 'active' | 'inactive' | 'maintenance';
  popularity: number;
}

export default function Services() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data for dry cleaning services
  const mockServices: Service[] = [
    {
      id: "1",
      name: "Dry Cleaning - Suits",
      description: "Professional dry cleaning for business suits and formal wear",
      category: "Dry Cleaning",
      price: 150,
      duration: "2-3 days",
      status: "active",
      popularity: 95
    },
    {
      id: "2", 
      name: "Dry Cleaning - Dresses",
      description: "Delicate dry cleaning for evening dresses and formal gowns",
      category: "Dry Cleaning",
      price: 120,
      duration: "2-3 days",
      status: "active",
      popularity: 88
    },
    {
      id: "3",
      name: "Wash & Press - Shirts",
      description: "Professional washing and pressing for dress shirts",
      category: "Wash & Press",
      price: 25,
      duration: "1 day",
      status: "active",
      popularity: 92
    },
    {
      id: "4",
      name: "Wash & Press - Pants",
      description: "Washing and pressing for trousers and casual pants",
      category: "Wash & Press", 
      price: 30,
      duration: "1 day",
      status: "active",
      popularity: 85
    },
    {
      id: "5",
      name: "Alterations - Hemming",
      description: "Professional hemming services for pants and dresses",
      category: "Alterations",
      price: 50,
      duration: "3-5 days",
      status: "active",
      popularity: 75
    },
    {
      id: "6",
      name: "Leather Cleaning",
      description: "Specialized cleaning for leather jackets and accessories",
      category: "Specialty",
      price: 200,
      duration: "5-7 days",
      status: "active",
      popularity: 60
    },
    {
      id: "7",
      name: "Wedding Dress Cleaning",
      description: "Specialized cleaning and preservation for wedding dresses",
      category: "Specialty",
      price: 500,
      duration: "7-10 days",
      status: "active",
      popularity: 45
    },
    {
      id: "8",
      name: "Express Service",
      description: "Same-day service for urgent cleaning needs",
      category: "Express",
      price: 100,
      duration: "Same day",
      status: "active",
      popularity: 70
    }
  ];

  const filteredServices = mockServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = service.status === "active";
    } else if (statusFilter === "inactive") {
      matchesStatus = service.status === "inactive";
    } else if (statusFilter === "maintenance") {
      matchesStatus = service.status === "maintenance";
    }
    
    return matchesSearch && matchesStatus;
  });

  const serviceStats = mockServices.reduce((acc, service) => {
    if (service.status === "active") {
      acc.active++;
    } else if (service.status === "inactive") {
      acc.inactive++;
    } else {
      acc.maintenance++;
    }
    acc.totalRevenue += service.price * service.popularity;
    return acc;
  }, { active: 0, inactive: 0, maintenance: 0, totalRevenue: 0 });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'inactive': return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
      case 'maintenance': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'maintenance': return 'Maintenance';
      default: return 'Unknown';
    }
  };

  return (
    <div className="p-8" data-testid="services-page">
      {/* Services Management Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-h1">Services Management</h1>
              <div className="status-indicator-enhanced bg-green-500"></div>
              <span className="text-label text-muted-foreground">All Systems Active</span>
            </div>
            <p className="text-body text-muted-foreground">Manage dry cleaning services and pricing</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            data-testid="service-analytics"
            onClick={() => {
              console.log("Opening service analytics...");
              alert("Service Analytics feature coming soon! This would show service performance, pricing optimization, and customer preferences.");
            }}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button 
            data-testid="add-service"
            onClick={() => {
              console.log("Adding new service...");
              alert("Service creation feature coming soon! This would open a modal to add a new dry cleaning service.");
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Service Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <Card className="bento-card lg:col-span-2 animate-fade-in">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">Service Popularity</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Most requested services</p>
                </div>
              </div>
              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs sm:text-sm">
                Live Data
              </Badge>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {mockServices.slice(0, 4).map((service) => (
                <div key={service.id} className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">{service.name}</span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-16 sm:w-24 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${service.popularity}%` }}
                      ></div>
                    </div>
                    <span className="text-xs sm:text-sm font-medium">{service.popularity}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bento-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground">Service Alerts</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Status updates</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">All Active</p>
                  <p className="text-xs text-green-600 dark:text-green-500">8 services running</p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">High Demand</p>
                  <p className="text-xs text-blue-600 dark:text-blue-500">3 services trending</p>
                </div>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Services</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {mockServices.length}
                </p>
              </div>
              <Shirt className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Services</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {serviceStats.active}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  ₹{Math.round(mockServices.reduce((acc, s) => acc + s.price, 0) / mockServices.length)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue Potential</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  ₹{serviceStats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card className="bento-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display font-semibold text-xl text-foreground">
              Dry Cleaning Services
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="search-services"
                />
              </div>
              <Button variant="outline" size="sm" data-testid="filter-services">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Popularity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id} data-testid={`service-row-${service.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>{service.category}</TableCell>
                  <TableCell className="font-medium">
                    ₹{service.price}
                  </TableCell>
                  <TableCell>{service.duration}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${service.popularity}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{service.popularity}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(service.status)}>
                      {getStatusText(service.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" data-testid={`edit-service-${service.id}`}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
