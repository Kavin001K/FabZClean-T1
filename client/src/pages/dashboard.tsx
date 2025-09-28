import FranchiseOwnerDashboard from "@/components/dashboard/franchise-owner-dashboard";

export default function Dashboard() {
  try {
    return <FranchiseOwnerDashboard />;
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">Failed to load dashboard. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}
