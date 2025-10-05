import FranchiseOwnerDashboard from "@/components/dashboard/franchise-owner-dashboard";
import { ErrorBoundary } from "@/components/error-boundary";

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <FranchiseOwnerDashboard />
    </ErrorBoundary>
  );
}
