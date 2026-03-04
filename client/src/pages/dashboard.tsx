import { useAuth } from "@/contexts/auth-context";
import AdminDashboard from "@/components/dashboard/admin-dashboard";

import { ErrorBoundary } from "@/components/error-boundary";

export default function Dashboard() {
  const { employee } = useAuth();

  if (!employee) return null;

  return (
    <ErrorBoundary>
      <AdminDashboard />
    </ErrorBoundary>
  );
}
