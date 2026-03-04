import fs from 'fs';

const sidebarPath = 'client/src/components/layout/sidebar.tsx';
let content = fs.readFileSync(sidebarPath, 'utf8');

// The instruction: "Your sidebar/bottom-nav should now just be: New order(POS), Active Orders, Customers, Print Queue (new), Settings."
// In our codebase:
// New Order (create-order)
// Active Orders (orders)
// Customers (customers)
// Print Queue (print-queue)
// Settings (settings / profile based on previous setup mapping to POS admin features)

const regex = /export const NAV_ITEMS = \[([\s\S]*?)\];/g;
const newNavItems = `export const NAV_ITEMS = [
  {
    title: "New Order",
    url: "/create-order",
    icon: PlusCircle,
  },
  {
    title: "Active Orders",
    url: "/orders",
    icon: ListOrdered,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Print Queue",
    url: "/print-queue",
    icon: Printer,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  }
];`;

content = content.replace(regex, newNavItems);

fs.writeFileSync(sidebarPath, content);
