import { useAuth } from "@/contexts/auth-context";
import AdminDashboard from "@/components/dashboard/admin-dashboard";
import FranchiseOwnerDashboard from "@/components/dashboard/franchise-owner-dashboard";
import EnhancedEmployeeDashboard from "@/components/dashboard/enhanced-employee-dashboard";
import { ErrorBoundary } from "@/components/error-boundary";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { employee, loading } = useAuth();
  const isLoading = loading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) return null;

  return (
    <ErrorBoundary>
      {(() => {
        switch (employee.role) {
          case 'admin':
            return <AdminDashboard />;
          case 'franchise_manager':
          case 'factory_manager': // Assuming factory manager gets similar view or has their own
          case 'manager':
            return <FranchiseOwnerDashboard />;
          case 'employee':
          case 'staff':
          case 'driver':
            return <EnhancedEmployeeDashboard />;
          default:
            return <EnhancedEmployeeDashboard />;
        }
      })()}
    </ErrorBoundary>
  );
}
