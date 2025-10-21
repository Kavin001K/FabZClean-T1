import React, { useState, useEffect } from 'react';
import { Database, Trash2, RefreshCw, BarChart3, Clock, HardDrive } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useCacheStats, useCacheInvalidation, useCacheWarming } from '../../hooks/use-cache';

export interface CacheStatsProps {
  cacheName?: string;
  className?: string;
}

export interface CacheManagerProps {
  className?: string;
}

export interface CacheWarmingProps {
  cacheName: string;
  data: any[];
  keyExtractor: (item: any) => string;
  onComplete?: () => void;
  className?: string;
}

/**
 * Cache Statistics Component
 */
export function CacheStats({ cacheName, className = "" }: CacheStatsProps) {
  const { stats, updateStats } = useCacheStats(cacheName);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await updateStats();
    setIsRefreshing(false);
  };

  const cacheData = cacheName ? stats[cacheName] : Object.values(stats)[0];
  
  if (!cacheData) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Database className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No cache data available</p>
        </CardContent>
      </Card>
    );
  }

  const { metrics } = cacheData;
  const hitRate = metrics.hitRate * 100;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Cache Statistics</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hit Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Hit Rate</span>
            <span className="text-sm text-gray-500">{hitRate.toFixed(1)}%</span>
          </div>
          <Progress value={hitRate} className="h-2" />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Hits</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{metrics.hits}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Misses</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{metrics.misses}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Size</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{metrics.size}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Trash2 className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Evictions</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{metrics.evictions}</p>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Memory Usage</span>
            <span className="text-sm text-gray-500">
              {(metrics.memoryUsage / 1024).toFixed(1)} KB
            </span>
          </div>
          <Progress 
            value={(metrics.memoryUsage / (1024 * 1024)) * 100} 
            className="h-2" 
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Cache Manager Component
 */
export function CacheManager({ className = "" }: CacheManagerProps) {
  const { stats, updateStats } = useCacheStats();
  const [selectedCache, setSelectedCache] = useState<string>('');

  const cacheNames = Object.keys(stats);
  const selectedCacheStats = selectedCache ? stats[selectedCache] : null;

  useEffect(() => {
    if (cacheNames.length > 0 && !selectedCache) {
      setSelectedCache(cacheNames[0]);
    }
  }, [cacheNames, selectedCache]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Cache Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCache} onValueChange={setSelectedCache}>
          <TabsList className="grid w-full grid-cols-4">
            {cacheNames.map(name => (
              <TabsTrigger key={name} value={name}>
                {name}
              </TabsTrigger>
            ))}
          </TabsList>

          {cacheNames.map(name => (
            <TabsContent key={name} value={name}>
              <div className="space-y-4">
                <CacheStats cacheName={name} />
                <CacheControls cacheName={name} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * Cache Controls Component
 */
function CacheControls({ cacheName }: { cacheName: string }) {
  const { invalidateByPattern, invalidateByPrefix, clearCache } = useCacheInvalidation(cacheName);
  const [pattern, setPattern] = useState('');
  const [prefix, setPrefix] = useState('');

  const handlePatternInvalidation = () => {
    if (pattern) {
      try {
        const regex = new RegExp(pattern);
        invalidateByPattern(regex);
        setPattern('');
      } catch (error) {
        console.error('Invalid regex pattern:', error);
      }
    }
  };

  const handlePrefixInvalidation = () => {
    if (prefix) {
      invalidateByPrefix(prefix);
      setPrefix('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Cache Controls</h3>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => clearCache()}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pattern Invalidation */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Invalidate by Pattern</label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter regex pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border rounded-md"
            />
            <Button
              size="sm"
              onClick={handlePatternInvalidation}
              disabled={!pattern}
            >
              Invalidate
            </Button>
          </div>
        </div>

        {/* Prefix Invalidation */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Invalidate by Prefix</label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border rounded-md"
            />
            <Button
              size="sm"
              onClick={handlePrefixInvalidation}
              disabled={!prefix}
            >
              Invalidate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Cache Warming Component
 */
export function CacheWarming({ 
  cacheName, 
  data, 
  keyExtractor, 
  onComplete,
  className = "" 
}: CacheWarmingProps) {
  const { warmCache, isWarming, progress } = useCacheWarming(
    cacheName,
    data,
    keyExtractor,
    {
      batchSize: 10,
      delay: 100
    }
  );

  useEffect(() => {
    if (progress === 100 && onComplete) {
      onComplete();
    }
  }, [progress, onComplete]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <RefreshCw className={`h-5 w-5 ${isWarming ? 'animate-spin' : ''}`} />
          <span>Cache Warming</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Warming {data.length} items to {cacheName} cache
          </div>
          <Button
            onClick={warmCache}
            disabled={isWarming}
            size="sm"
          >
            {isWarming ? 'Warming...' : 'Start Warming'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Cache Performance Monitor Component
 */
export function CachePerformanceMonitor({ className = "" }: { className?: string }) {
  const { stats } = useCacheStats();
  const [performanceData, setPerformanceData] = useState<Array<{
    timestamp: number;
    hitRate: number;
    size: number;
  }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const allStats = Object.values(stats);
      
      if (allStats.length > 0) {
        const avgHitRate = allStats.reduce((sum, stat) => sum + stat.metrics.hitRate, 0) / allStats.length;
        const totalSize = allStats.reduce((sum, stat) => sum + stat.metrics.size, 0);
        
        setPerformanceData(prev => [
          ...prev.slice(-19), // Keep last 20 data points
          { timestamp: now, hitRate: avgHitRate * 100, size: totalSize }
        ]);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [stats]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Performance Monitor</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Hit Rate Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Average Hit Rate</span>
              <span className="text-sm text-gray-500">
                {performanceData.length > 0 
                  ? `${performanceData[performanceData.length - 1]?.hitRate.toFixed(1)}%`
                  : '0%'
                }
              </span>
            </div>
            <div className="h-20 bg-gray-100 rounded flex items-end space-x-1 p-2">
              {performanceData.map((point, index) => (
                <div
                  key={index}
                  className="bg-blue-500 rounded-sm flex-1"
                  style={{ height: `${point.hitRate}%` }}
                />
              ))}
            </div>
          </div>

          {/* Cache Size Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Cache Size</span>
              <span className="text-sm text-gray-500">
                {performanceData.length > 0 
                  ? performanceData[performanceData.length - 1]?.size
                  : 0
                } items
              </span>
            </div>
            <div className="h-20 bg-gray-100 rounded flex items-end space-x-1 p-2">
              {performanceData.map((point, index) => (
                <div
                  key={index}
                  className="bg-green-500 rounded-sm flex-1"
                  style={{ height: `${Math.min(100, (point.size / 1000) * 100)}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Cache Status Badge Component
 */
export function CacheStatusBadge({ 
  cacheName, 
  className = "" 
}: { 
  cacheName: string; 
  className?: string; 
}) {
  const { stats } = useCacheStats(cacheName);
  const cacheData = stats[cacheName];

  if (!cacheData) {
    return (
      <Badge variant="secondary" className={className}>
        <Clock className="h-3 w-3 mr-1" />
        No Data
      </Badge>
    );
  }

  const { metrics } = cacheData;
  const hitRate = metrics.hitRate * 100;

  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let icon = <Clock className="h-3 w-3 mr-1" />;

  if (hitRate >= 80) {
    variant = "default";
    icon = <BarChart3 className="h-3 w-3 mr-1" />;
  } else if (hitRate >= 60) {
    variant = "secondary";
    icon = <BarChart3 className="h-3 w-3 mr-1" />;
  } else if (hitRate < 30) {
    variant = "destructive";
    icon = <Trash2 className="h-3 w-3 mr-1" />;
  }

  return (
    <Badge variant={variant} className={className}>
      {icon}
      {hitRate.toFixed(0)}% Hit Rate
    </Badge>
  );
}
