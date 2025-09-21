import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { 
  Clock, 
  Calendar, 
  Users, 
  Download, 
  Upload,
  CheckCircle,
  AlertTriangle,
  User,
  DollarSign,
  TrendingUp,
  FileText,
  BarChart3,
  Eye,
  Edit
} from "lucide-react";
import { formatCurrency } from "@/lib/data";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  position: string;
  salaryType: 'hourly' | 'monthly';
  baseSalary: number;
  hourlyRate?: number;
  workingHours: number;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  totalHours: number;
  overtimeHours: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  location?: string;
  notes?: string;
}

interface SalaryCalculation {
  employeeId: string;
  employeeName: string;
  period: string;
  baseSalary: number;
  hoursWorked: number;
  overtimeHours: number;
  overtimePay: number;
  deductions: number;
  bonuses: number;
  grossSalary: number;
  netSalary: number;
  attendanceRate: number;
}

interface AttendanceTrackerProps {
  employees: Employee[];
}

export default function AttendanceTracker({ employees }: AttendanceTrackerProps) {
  const { toast } = useToast();
  const { addNotification } = useNotifications();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [salaryCalculations, setSalaryCalculations] = useState<SalaryCalculation[]>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<'attendance' | 'salary'>('attendance');

  // Demo attendance data
  useEffect(() => {
    const generateDemoData = () => {
      const records: AttendanceRecord[] = [];
      const calculations: SalaryCalculation[] = [];
      
      employees.forEach(employee => {
        // Generate attendance records for the last 30 days
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          // Random attendance status
          const statuses = ['present', 'present', 'present', 'late', 'absent'];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          let checkIn = null;
          let checkOut = null;
          let totalHours = 0;
          let overtimeHours = 0;
          
          if (status === 'present' || status === 'late') {
            checkIn = status === 'late' ? '09:30' : '09:00';
            checkOut = '17:30';
            totalHours = 8.5;
            overtimeHours = totalHours > employee.workingHours ? totalHours - employee.workingHours : 0;
          }
          
          records.push({
            id: `att-${employee.id}-${dateStr}`,
            employeeId: employee.id,
            employeeName: employee.name,
            date: dateStr,
            checkIn,
            checkOut,
            breakStart: null,
            breakEnd: null,
            totalHours,
            overtimeHours,
            status: status as any,
            location: 'Main Branch',
            notes: ''
          });
        }
        
        // Generate salary calculation for current month
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyRecords = records.filter(r => r.employeeId === employee.id && r.date.startsWith(currentMonth));
        
        const hoursWorked = monthlyRecords.reduce((sum, r) => sum + r.totalHours, 0);
        const overtimeHours = monthlyRecords.reduce((sum, r) => sum + r.overtimeHours, 0);
        const presentDays = monthlyRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        const totalDays = monthlyRecords.length;
        
        let baseSalary = 0;
        let overtimePay = 0;
        
        if (employee.salaryType === 'hourly') {
          baseSalary = hoursWorked * (employee.hourlyRate || 0);
          overtimePay = overtimeHours * (employee.hourlyRate || 0) * 1.5; // 1.5x overtime rate
        } else {
          baseSalary = employee.baseSalary;
          overtimePay = overtimeHours * (employee.hourlyRate || 250) * 1.5;
        }
        
        const deductions = baseSalary * 0.1; // 10% deductions (tax, PF, etc.)
        const bonuses = presentDays >= 25 ? baseSalary * 0.05 : 0; // 5% bonus for good attendance
        
        calculations.push({
          employeeId: employee.id,
          employeeName: employee.name,
          period: currentMonth,
          baseSalary,
          hoursWorked,
          overtimeHours,
          overtimePay,
          deductions,
          bonuses,
          grossSalary: baseSalary + overtimePay + bonuses,
          netSalary: baseSalary + overtimePay + bonuses - deductions,
          attendanceRate: (presentDays / totalDays) * 100
        });
      });
      
      setAttendanceRecords(records);
      setSalaryCalculations(calculations);
    };

    generateDemoData();
  }, [employees]);

  const handleManualEntry = () => {
    if (!selectedEmployee || !selectedDate) {
      toast({
        title: "Validation Error",
        description: "Please select employee and date.",
        variant: "destructive",
      });
      return;
    }

    const employee = employees.find(emp => emp.id === selectedEmployee);
    if (!employee) return;

    const existingRecord = attendanceRecords.find(r => 
      r.employeeId === selectedEmployee && r.date === selectedDate
    );

    if (existingRecord) {
      toast({
        title: "Record Exists",
        description: "Attendance record for this employee and date already exists.",
        variant: "destructive",
      });
      return;
    }

    // For demo, create a present record
    const newRecord: AttendanceRecord = {
      id: `att-${selectedEmployee}-${selectedDate}`,
      employeeId: selectedEmployee,
      employeeName: employee.name,
      date: selectedDate,
      checkIn: '09:00',
      checkOut: '17:30',
      breakStart: null,
      breakEnd: null,
      totalHours: 8.5,
      overtimeHours: 0.5,
      status: 'present',
      location: 'Main Branch',
      notes: 'Manual entry'
    };

    setAttendanceRecords([...attendanceRecords, newRecord]);

    addNotification({
      type: 'success',
      title: 'Attendance Record Added!',
      message: `Attendance record for ${employee.name} on ${selectedDate} has been created.`,
    });

    toast({
      title: "Record Added",
      description: "Attendance record has been added successfully.",
    });
  };

  const exportData = (type: 'attendance' | 'salary') => {
    let csvData: any[] = [];
    let filename = '';

    if (type === 'attendance') {
      csvData = attendanceRecords.map(record => ({
        'Date': record.date,
        'Employee ID': record.employeeId,
        'Employee Name': record.employeeName,
        'Check In': record.checkIn || 'N/A',
        'Check Out': record.checkOut || 'N/A',
        'Total Hours': record.totalHours,
        'Overtime Hours': record.overtimeHours,
        'Status': record.status,
        'Location': record.location || 'N/A',
        'Notes': record.notes || 'N/A'
      }));
      filename = `attendance_records_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      csvData = salaryCalculations.map(calc => ({
        'Employee ID': calc.employeeId,
        'Employee Name': calc.employeeName,
        'Period': calc.period,
        'Base Salary': calc.baseSalary,
        'Hours Worked': calc.hoursWorked,
        'Overtime Hours': calc.overtimeHours,
        'Overtime Pay': calc.overtimePay,
        'Deductions': calc.deductions,
        'Bonuses': calc.bonuses,
        'Gross Salary': calc.grossSalary,
        'Net Salary': calc.netSalary,
        'Attendance Rate': `${calc.attendanceRate.toFixed(1)}%`
      }));
      filename = `salary_calculations_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `${type === 'attendance' ? 'Attendance' : 'Salary'} data has been exported successfully.`,
    });

    setIsExportDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'late': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'absent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'half_day': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'on_leave': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'late': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'absent': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'half_day': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'on_leave': return <Calendar className="w-4 h-4 text-purple-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const todayRecords = attendanceRecords.filter(r => r.date === selectedDate);
  const currentMonthRecords = attendanceRecords.filter(r => 
    r.date.startsWith(new Date().toISOString().slice(0, 7))
  );

  const attendanceStats = {
    present: currentMonthRecords.filter(r => r.status === 'present').length,
    late: currentMonthRecords.filter(r => r.status === 'late').length,
    absent: currentMonthRecords.filter(r => r.status === 'absent').length,
    total: currentMonthRecords.length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Tracker</h2>
          <p className="text-muted-foreground">
            Track employee attendance and calculate accurate salaries
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {todayRecords.filter(r => r.status === 'present' || r.status === 'late').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent Today</p>
                <p className="text-2xl font-bold text-red-600">
                  {todayRecords.filter(r => r.status === 'absent').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Attendance</p>
                <p className="text-2xl font-bold">
                  {attendanceStats.total > 0 ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Payroll</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(salaryCalculations.reduce((sum, calc) => sum + calc.netSalary, 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="salary">Salary Calculation</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="attendance-date">Select Date</Label>
              <Input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Records - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance records found for this date.
                  </div>
                ) : (
                  todayRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-foreground">
                            {record.employeeName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{record.employeeName}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.employeeId} • {record.location}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {record.checkIn && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">In:</span> {record.checkIn}
                            </p>
                          )}
                          {record.checkOut && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Out:</span> {record.checkOut}
                            </p>
                          )}
                          <p className="text-sm font-medium">
                            {record.totalHours}h worked
                            {record.overtimeHours > 0 && (
                              <span className="text-orange-600"> (+{record.overtimeHours}h OT)</span>
                            )}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <Badge className={getStatusColor(record.status)}>
                            {record.status ? record.status.replace('_', ' ') : 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Calculation Tab */}
        <TabsContent value="salary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Salary Calculations - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salaryCalculations.map((calc) => (
                  <div key={calc.employeeId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{calc.employeeName}</h3>
                        <p className="text-sm text-muted-foreground">{calc.employeeId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(calc.netSalary)}
                        </p>
                        <p className="text-sm text-muted-foreground">Net Salary</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Base Salary</p>
                        <p className="font-medium">{formatCurrency(calc.baseSalary)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Overtime Pay</p>
                        <p className="font-medium">{formatCurrency(calc.overtimePay)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Bonuses</p>
                        <p className="font-medium text-green-600">{formatCurrency(calc.bonuses)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Deductions</p>
                        <p className="font-medium text-red-600">-{formatCurrency(calc.deductions)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          <span className="text-muted-foreground">Hours Worked:</span> {calc.hoursWorked.toFixed(1)}h
                        </span>
                        <span>
                          <span className="text-muted-foreground">Overtime:</span> {calc.overtimeHours.toFixed(1)}h
                        </span>
                      </div>
                      <Badge variant={calc.attendanceRate >= 90 ? "default" : "secondary"}>
                        {calc.attendanceRate.toFixed(1)}% Attendance
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Attendance Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-employee">Select Employee</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} ({employee.employeeId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="manual-date">Select Date</Label>
                  <Input
                    id="manual-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>
              
              <Button onClick={handleManualEntry} disabled={!selectedEmployee}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Add Present Record
              </Button>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Manual Entry Info</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• This will create a "Present" record with standard 9:00 AM - 5:30 PM hours</li>
                  <li>• Overtime will be calculated based on employee's working hours</li>
                  <li>• You can edit the record later if needed</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${isExportDialogOpen ? 'block' : 'hidden'}`}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Export Type</Label>
              <Select value={exportType} onValueChange={(value: 'attendance' | 'salary') => setExportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance Records</SelectItem>
                  <SelectItem value="salary">Salary Calculations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {exportType === 'attendance' 
                ? 'Export all attendance records with employee details and hours worked.'
                : 'Export salary calculations including base pay, overtime, and deductions.'
              }
            </p>
            
            <div className="flex gap-2">
              <Button onClick={() => exportData(exportType)} className="flex-1">
                <FileText className="w-4 h-4 mr-2" />
                Export as CSV
              </Button>
              <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
