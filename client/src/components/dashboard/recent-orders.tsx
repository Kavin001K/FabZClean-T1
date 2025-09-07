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


export default function RecentOrders() {
  return (
    <div className="space-y-8">
      {RECENT_ORDERS_DATA.map((order, i) => (
        <div key={i} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={order.avatar} alt="Avatar" />
            <AvatarFallback>{order.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{order.name}</p>
            <p className="text-sm text-muted-foreground">{order.email}</p>
          </div>
          <div className="ml-auto font-medium">{formatCurrency(order.totalAmount)}</div>
        </div>
      ))}
    </div>
  );
}
