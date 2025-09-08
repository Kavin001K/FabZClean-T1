import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Dry Cleaning", orders: 4000 },
  { name: "Premium Laundry", orders: 3000 },
  { name: "Laundry By Kg", orders: 2000 },
  { name: "Bags Clean", orders: 2780 },
  { name: "FootWear Clean", orders: 1890 },
  { name: "Steam Ironing", orders: 2390 },
];

export default function ServicePopularityChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Popularity</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="orders" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
