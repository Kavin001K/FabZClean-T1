import { useAuth } from "@/contexts/auth-context";
import AdminDashboard from "@/components/dashboard/admin-dashboard";

import { ErrorBoundary } from "@/components/error-boundary";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const { employee } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (employee) {
      if (employee.role === 'franchise_manager') {
        setLocation('/franchise-dashboard');
      } else if (employee.role === 'factory_manager') {
        setLocation('/factory-dashboard');
      } else if (employee.role === 'employee' || employee.role === 'driver' || employee.role === 'staff') {
        setLocation('/employee-dashboard');
      }
    }
  }, [employee, setLocation]);

  if (!employee) return null;

  // Only render AdminDashboard for admins
  // Others will be redirected by the useEffect
  if (employee.role === 'admin') {
    return (
      <ErrorBoundary>
        <AdminDashboard />
      </ErrorBoundary>
    );
  }

  return null; // Or a loading spinner while redirecting
}
