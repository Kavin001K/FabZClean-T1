import { useState, useEffect } from 'react';
import { analyticsApi, ordersApi } from '@/lib/data-service';

export default function DebugPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testApi = async () => {
      try {
        console.log('Testing API calls...');
        
        const [metrics, orders] = await Promise.all([
          analyticsApi.getDashboardMetrics(),
          ordersApi.getAll()
        ]);
        
        console.log('API calls successful:', { metrics, orders });
        setData({ metrics, orders });
        setError(null);
      } catch (err) {
        console.error('API call failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Metrics:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(data?.metrics, null, 2)}
          </pre>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Orders (first 2):</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(data?.orders?.slice(0, 2), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
