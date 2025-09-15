import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  BarChart3, 
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Plus,
  Trash2
} from 'lucide-react';
import { printDriver, ReportData } from '@/lib/print-driver';
import { useToast } from '@/hooks/use-toast';

interface ReportTable {
  title: string;
  headers: string[];
  rows: string[][];
}

export const ReportGenerator: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    title: 'Monthly Business Report',
    subtitle: 'Performance Analysis and Insights',
    reportDate: new Date().toISOString().split('T')[0],
    generatedBy: 'System Administrator',
    company: {
      name: 'FabZClean Services',
      address: '123 Business Street, City, State 12345',
      logo: '/assets/logo.webp'
    },
    summary: {
      totalOrders: 0,
      totalRevenue: 0,
      totalCustomers: 0,
      averageOrderValue: 0,
      topServices: []
    },
    tables: [],
    footer: 'This report was generated automatically by the FabZClean system.'
  });

  const [newTable, setNewTable] = useState<ReportTable>({
    title: '',
    headers: ['Column 1', 'Column 2', 'Column 3'],
    rows: []
  });

  const [newRow, setNewRow] = useState<string[]>(['', '', '']);

  const { toast } = useToast();

  // Simulate fetching data from API
  useEffect(() => {
    // In a real app, this would fetch from your analytics API
    const mockData = {
      totalOrders: 156,
      totalRevenue: 23450,
      totalCustomers: 89,
      averageOrderValue: 150.32,
      topServices: [
        { name: 'Basic Cleaning', count: 45, revenue: 6750 },
        { name: 'Deep Cleaning', count: 32, revenue: 9600 },
        { name: 'Window Cleaning', count: 28, revenue: 4200 },
        { name: 'Carpet Cleaning', count: 25, revenue: 3750 },
        { name: 'Upholstery Cleaning', count: 26, revenue: 3150 }
      ]
    };

    setReportData(prev => ({
      ...prev,
      summary: mockData
    }));
  }, []);

  const addTable = () => {
    if (!newTable.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a table title",
        variant: "destructive"
      });
      return;
    }

    setReportData(prev => ({
      ...prev,
      tables: [...prev.tables, { ...newTable }]
    }));

    setNewTable({
      title: '',
      headers: ['Column 1', 'Column 2', 'Column 3'],
      rows: []
    });
  };

  const removeTable = (index: number) => {
    setReportData(prev => ({
      ...prev,
      tables: prev.tables.filter((_, i) => i !== index)
    }));
  };

  const addRowToTable = (tableIndex: number) => {
    if (newRow.some(cell => !cell.trim())) {
      toast({
        title: "Error",
        description: "Please fill in all row cells",
        variant: "destructive"
      });
      return;
    }

    const updatedTables = [...reportData.tables];
    updatedTables[tableIndex].rows.push([...newRow]);
    
    setReportData(prev => ({
      ...prev,
      tables: updatedTables
    }));

    setNewRow(['', '', '']);
  };

  const removeRowFromTable = (tableIndex: number, rowIndex: number) => {
    const updatedTables = [...reportData.tables];
    updatedTables[tableIndex].rows.splice(rowIndex, 1);
    
    setReportData(prev => ({
      ...prev,
      tables: updatedTables
    }));
  };

  const updateTableHeader = (tableIndex: number, headerIndex: number, value: string) => {
    const updatedTables = [...reportData.tables];
    updatedTables[tableIndex].headers[headerIndex] = value;
    
    setReportData(prev => ({
      ...prev,
      tables: updatedTables
    }));
  };

  const updateTableCell = (tableIndex: number, rowIndex: number, cellIndex: number, value: string) => {
    const updatedTables = [...reportData.tables];
    updatedTables[tableIndex].rows[rowIndex][cellIndex] = value;
    
    setReportData(prev => ({
      ...prev,
      tables: updatedTables
    }));
  };

  const generateReport = async () => {
    try {
      await printDriver.printProfessionalReport(reportData);
      toast({
        title: "Success",
        description: "Report generated successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    }
  };

  const previewReport = () => {
    toast({
      title: "Preview",
      description: "Report preview would open here"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Report Title</Label>
                    <Input
                      id="title"
                      value={reportData.title}
                      onChange={(e) => setReportData({ ...reportData, title: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={reportData.subtitle || ''}
                      onChange={(e) => setReportData({ ...reportData, subtitle: e.target.value })}
                      placeholder="Optional subtitle"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="reportDate">Report Date</Label>
                    <Input
                      id="reportDate"
                      type="date"
                      value={reportData.reportDate}
                      onChange={(e) => setReportData({ ...reportData, reportDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="generatedBy">Generated By</Label>
                    <Input
                      id="generatedBy"
                      value={reportData.generatedBy}
                      onChange={(e) => setReportData({ ...reportData, generatedBy: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={reportData.company.name}
                      onChange={(e) => setReportData({
                        ...reportData,
                        company: { ...reportData.company, name: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="companyAddress">Company Address</Label>
                    <Textarea
                      id="companyAddress"
                      value={reportData.company.address}
                      onChange={(e) => setReportData({
                        ...reportData,
                        company: { ...reportData.company, address: e.target.value }
                      })}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="footer">Footer Text</Label>
                    <Textarea
                      id="footer"
                      value={reportData.footer || ''}
                      onChange={(e) => setReportData({ ...reportData, footer: e.target.value })}
                      placeholder="Optional footer text"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Total Orders</span>
                    </div>
                    <div className="text-2xl font-bold">{reportData.summary.totalOrders}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Total Revenue</span>
                    </div>
                    <div className="text-2xl font-bold">₹{reportData.summary.totalRevenue.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Total Customers</span>
                    </div>
                    <div className="text-2xl font-bold">{reportData.summary.totalCustomers}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Avg Order Value</span>
                    </div>
                    <div className="text-2xl font-bold">₹{reportData.summary.averageOrderValue.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Top Performing Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.summary.topServices.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-semibold">{service.name}</div>
                          <div className="text-sm text-gray-600">{service.count} orders</div>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          ₹{service.revenue.toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tables" className="space-y-6">
              <div className="space-y-6">
                {reportData.tables.map((table, tableIndex) => (
                  <Card key={tableIndex}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{table.title}</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTable(tableIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Headers */}
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${table.headers.length}, 1fr)` }}>
                          {table.headers.map((header, headerIndex) => (
                            <Input
                              key={headerIndex}
                              value={header}
                              onChange={(e) => updateTableHeader(tableIndex, headerIndex, e.target.value)}
                              placeholder={`Header ${headerIndex + 1}`}
                            />
                          ))}
                        </div>

                        {/* Rows */}
                        <div className="space-y-2">
                          {table.rows.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex items-center gap-2">
                              <div className="grid gap-2 flex-1" style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}>
                                {row.map((cell, cellIndex) => (
                                  <Input
                                    key={cellIndex}
                                    value={cell}
                                    onChange={(e) => updateTableCell(tableIndex, rowIndex, cellIndex, e.target.value)}
                                    placeholder={`Cell ${cellIndex + 1}`}
                                  />
                                ))}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeRowFromTable(tableIndex, rowIndex)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        {/* Add Row */}
                        <div className="flex items-center gap-2">
                          <div className="grid gap-2 flex-1" style={{ gridTemplateColumns: `repeat(${table.headers.length}, 1fr)` }}>
                            {newRow.map((cell, cellIndex) => (
                              <Input
                                key={cellIndex}
                                value={cell}
                                onChange={(e) => {
                                  const updatedRow = [...newRow];
                                  updatedRow[cellIndex] = e.target.value;
                                  setNewRow(updatedRow);
                                }}
                                placeholder={`New cell ${cellIndex + 1}`}
                              />
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addRowToTable(tableIndex)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Add New Table */}
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle>Add New Table</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tableTitle">Table Title</Label>
                        <Input
                          id="tableTitle"
                          value={newTable.title}
                          onChange={(e) => setNewTable({ ...newTable, title: e.target.value })}
                          placeholder="Enter table title"
                        />
                      </div>
                      
                      <div>
                        <Label>Number of Columns</Label>
                        <Select
                          value={newTable.headers.length.toString()}
                          onValueChange={(value) => {
                            const numCols = parseInt(value);
                            const newHeaders = Array(numCols).fill(0).map((_, i) => `Column ${i + 1}`);
                            setNewTable({ ...newTable, headers: newHeaders });
                            setNewRow(Array(numCols).fill(''));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[2, 3, 4, 5, 6].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num} columns</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button onClick={addTable} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Table
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Report Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">{reportData.title}</h3>
                      {reportData.subtitle && (
                        <p className="text-gray-600 mb-4">{reportData.subtitle}</p>
                      )}
                      <div className="text-sm text-gray-500">
                        Generated on {reportData.reportDate} by {reportData.generatedBy}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{reportData.summary.totalOrders}</div>
                        <div className="text-sm text-gray-600">Orders</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">₹{reportData.summary.totalRevenue.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Revenue</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{reportData.summary.totalCustomers}</div>
                        <div className="text-sm text-gray-600">Customers</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">₹{reportData.summary.averageOrderValue.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Avg Order</div>
                      </div>
                    </div>
                    
                    {reportData.tables.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-semibold">Tables ({reportData.tables.length})</h4>
                        {reportData.tables.map((table, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <h5 className="font-medium mb-2">{table.title}</h5>
                            <div className="text-sm text-gray-600">
                              {table.headers.length} columns, {table.rows.length} rows
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={previewReport}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={generateReport}>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
