import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/data";

// NOTE: We'll use static data for now. We will reconnect this to the API later.
const RECENT_ORDERS_DATA = [
  {
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
    avatar: "/avatars/01.png",
    totalAmount: 1999.00,
  },
  {
    name: "Jackson Lee",
    email: "jackson.lee@email.com",
    avatar: "/avatars/02.png",
    totalAmount: 39.00,
  },
  {
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    avatar: "/avatars/03.png",
    totalAmount: 299.00,
  },
  {
    name: "William Kim",
    email: "will@email.com",
    avatar: "/avatars/04.png",
    totalAmount: 99.00,
  },
  {
    name: "Sofia Davis",
    email: "sofia.davis@email.com",
    avatar: "/avatars/05.png",
    totalAmount: 39.00,
  },
];

interface Order {
  id: string;
  customerName: string;
  date: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  total: number;
  service: string;
}

interface RecentOrdersProps {
  orders?: Order[];
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  const displayOrders = orders || RECENT_ORDERS_DATA.map((order, i) => ({
    id: `ORD${i + 1}`,
    customerName: order.name,
    date: new Date().toISOString().split('T')[0],
    status: 'Completed' as const,
    total: order.totalAmount,
    service: 'Dry Cleaning'
  }));

  return (
    <div className="space-y-8">
      {displayOrders.map((order, i) => (
        <div key={order.id || i} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{order.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">{order.service}</p>
          </div>
          <div className="ml-auto font-medium">{formatCurrency(order.total)}</div>
        </div>
      ))}
    </div>
  );
}
