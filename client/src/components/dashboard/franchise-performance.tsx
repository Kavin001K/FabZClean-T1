import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const franchiseData = [
  { name: "Downtown Central", revenue: "₹450,231.89", change: "+15.2%", status: "active" },
  { name: "Northside Hub", revenue: "₹320,112.45", change: "+8.9%", status: "active" },
  { name: "Eastwood Branch", revenue: "₹280,543.21", change: "-1.2%", status: "warning" },
  { name: "Southbridge Mall", revenue: "₹190,876.54", change: "+5.4%", status: "active" },
];

export default function FranchisePerformance() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Franchises</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Franchise</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">YoY Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {franchiseData.map((franchise) => (
              <TableRow key={franchise.name}>
                <TableCell className="font-medium">{franchise.name}</TableCell>
                <TableCell className="text-right">{franchise.revenue}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={franchise.change.startsWith('+') ? "default" : "destructive"}>
                    {franchise.change}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
