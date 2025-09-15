import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  Key,
  Server,
  Globe,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DatabaseStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  error?: string;
}

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  ssl: string;
  restApiUrl?: string;
  stackProjectId?: string;
  stackPublishableKey?: string;
  stackSecretKey?: string;
  jwksUrl?: string;
}

export default function DatabaseStatus() {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [dbConfig, setDbConfig] = useState<DatabaseConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const checkDatabaseStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/health/database');
      const status = await response.json();
      setDbStatus(status);
    } catch (error) {
      setDbStatus({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDatabaseConfig = async () => {
    try {
      const response = await fetch('/api/database/info');
      const config = await response.json();
      setDbConfig(config);
    } catch (error) {
      console.error('Failed to fetch database config:', error);
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
    getDatabaseConfig();
  }, []);

  const handleRefresh = () => {
    checkDatabaseStatus();
    getDatabaseConfig();
    toast({
      title: "Database Status",
      description: "Database status refreshed successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Database Status</h1>
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Database Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {dbStatus?.status === 'healthy' ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  {dbStatus?.status === 'healthy' ? 'Connected' : 'Disconnected'}
                </span>
                <Badge variant={dbStatus?.status === 'healthy' ? 'default' : 'destructive'}>
                  {dbStatus?.status === 'healthy' ? 'Healthy' : 'Unhealthy'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Last checked: {dbStatus?.timestamp ? new Date(dbStatus.timestamp).toLocaleString() : 'Never'}
              </p>
              {dbStatus?.error && (
                <p className="text-sm text-red-500 mt-1">Error: {dbStatus.error}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Configuration */}
      {dbConfig && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Database Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Host:</span>
                <span className="text-sm text-muted-foreground">{dbConfig.host}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Port:</span>
                <span className="text-sm text-muted-foreground">{dbConfig.port}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Database:</span>
                <span className="text-sm text-muted-foreground">{dbConfig.database}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">User:</span>
                <span className="text-sm text-muted-foreground">{dbConfig.user}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">SSL:</span>
                <Badge variant="outline">{dbConfig.ssl}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dbConfig.restApiUrl && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">REST API URL:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                      {dbConfig.restApiUrl}
                    </code>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              {dbConfig.stackProjectId && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Stack Project ID:</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {dbConfig.stackProjectId.substring(0, 8)}...
                  </span>
                </div>
              )}
              {dbConfig.jwksUrl && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">JWKS URL:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                      {dbConfig.jwksUrl}
                    </code>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Stack Auth</p>
                <p className="text-xs text-muted-foreground">
                  {dbConfig?.stackProjectId ? 'Configured' : 'Not configured'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Database Auth</p>
                <p className="text-xs text-muted-foreground">
                  {dbConfig?.user ? 'Owner access' : 'Not configured'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">REST API</p>
                <p className="text-xs text-muted-foreground">
                  {dbConfig?.restApiUrl ? 'Available' : 'Not available'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Neon Console
            </Button>
            <Button variant="outline">
              <Database className="h-4 w-4 mr-2" />
              View Tables
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
