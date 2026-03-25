import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import AdminDashboard from "@/components/dashboard/admin-dashboard";
import { ErrorBoundary } from "@/components/error-boundary";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load role-specific dashboards
const StoreManagerDashboard = lazy(() => import("@/components/dashboard/store-manager-dashboard"));
const FactoryManagerDashboard = lazy(() => import("@/components/dashboard/factory-manager-dashboard"));
const StoreStaffDashboard = lazy(() => import("@/components/dashboard/store-staff-dashboard"));

const DashboardLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export default function Dashboard() {
  const { employee } = useAuth();

  useEffect(() => {
    document.title = "Dashboard | FabzClean";
  }, []);

  if (!employee) return null;

  const renderDashboard = () => {
    switch (employee.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'store_manager':
        return (
          <Suspense fallback={<DashboardLoader />}>
            <StoreManagerDashboard />
          </Suspense>
        );
      case 'factory_manager':
        return (
          <Suspense fallback={<DashboardLoader />}>
            <FactoryManagerDashboard />
          </Suspense>
        );
      case 'store_staff':
        return (
          <Suspense fallback={<DashboardLoader />}>
            <StoreStaffDashboard />
          </Suspense>
        );
      default:
        // Fallback for any other role
        return <AdminDashboard />;
    }
  };

  return (
    <ErrorBoundary>
      {renderDashboard()}
    </ErrorBoundary>
  );
}
