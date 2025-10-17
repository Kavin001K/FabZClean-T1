/**
 * Database Query Optimization for FabZClean
 * Implements query optimization strategies and indexing recommendations
 */

export interface QueryPlan {
  query: string;
  estimatedCost: number;
  executionTime: number;
  indexes: string[];
  optimizations: string[];
}

export interface IndexRecommendation {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface QueryMetrics {
  query: string;
  executionCount: number;
  averageTime: number;
  totalTime: number;
  slowQueries: number;
  lastExecuted: Date;
}

/**
 * Query Analyzer and Optimizer
 */
export class DatabaseQueryOptimizer {
  private queryMetrics: Map<string, QueryMetrics> = new Map();
  private slowQueryThreshold: number = 100; // milliseconds

  /**
   * Analyze query performance and suggest optimizations
   */
  analyzeQuery(query: string, executionTime: number): QueryPlan {
    const normalizedQuery = this.normalizeQuery(query);
    
    // Update metrics
    this.updateMetrics(normalizedQuery, executionTime);
    
    // Analyze query structure
    const analysis = this.analyzeQueryStructure(normalizedQuery);
    
    // Generate optimization suggestions
    const optimizations = this.generateOptimizations(normalizedQuery, analysis);
    
    // Recommend indexes
    const indexes = this.recommendIndexes(normalizedQuery, analysis);
    
    return {
      query: normalizedQuery,
      estimatedCost: this.estimateCost(analysis),
      executionTime,
      indexes,
      optimizations
    };
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalQueries: number;
    slowQueries: number;
    averageTime: number;
    topSlowQueries: QueryMetrics[];
  } {
    const allMetrics = Array.from(this.queryMetrics.values());
    const totalQueries = allMetrics.reduce((sum, m) => sum + m.executionCount, 0);
    const slowQueries = allMetrics.reduce((sum, m) => sum + m.slowQueries, 0);
    const totalTime = allMetrics.reduce((sum, m) => sum + m.totalTime, 0);
    const averageTime = totalQueries > 0 ? totalTime / totalQueries : 0;
    
    const topSlowQueries = allMetrics
      .filter(m => m.averageTime > this.slowQueryThreshold)
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    return {
      totalQueries,
      slowQueries,
      averageTime,
      topSlowQueries
    };
  }

  /**
   * Generate index recommendations
   */
  getIndexRecommendations(): IndexRecommendation[] {
    const recommendations: IndexRecommendation[] = [];
    const frequentQueries = this.getFrequentQueries();
    
    for (const query of frequentQueries) {
      const analysis = this.analyzeQueryStructure(query);
      const queryRecommendations = this.recommendIndexes(query, analysis);
      recommendations.push(...queryRecommendations);
    }
    
    return this.prioritizeRecommendations(recommendations);
  }

  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\d+/g, '?')
      .trim();
  }

  private analyzeQueryStructure(query: string): any {
    const analysis = {
      hasWhere: query.includes('where'),
      hasJoin: query.includes('join'),
      hasOrderBy: query.includes('order by'),
      hasGroupBy: query.includes('group by'),
      hasLimit: query.includes('limit'),
      tableCount: (query.match(/from\s+(\w+)/g) || []).length,
      whereConditions: this.extractWhereConditions(query),
      joinTables: this.extractJoinTables(query),
      orderColumns: this.extractOrderColumns(query),
      groupColumns: this.extractGroupColumns(query)
    };
    
    return analysis;
  }

  private extractWhereConditions(query: string): string[] {
    const whereMatch = query.match(/where\s+(.+?)(?:\s+order|\s+group|\s+limit|$)/i);
    if (!whereMatch) return [];
    
    const conditions = whereMatch[1]
      .split(/\s+(?:and|or)\s+/i)
      .map(condition => condition.trim().split(/\s+/)[0])
      .filter(column => column && !['=', '<', '>', '<=', '>=', 'like', 'in'].includes(column));
    
    return conditions;
  }

  private extractJoinTables(query: string): string[] {
    const joinMatches = query.match(/(?:inner|left|right|full)?\s*join\s+(\w+)/gi);
    return joinMatches ? joinMatches.map(match => match.split(/\s+/).pop()!) : [];
  }

  private extractOrderColumns(query: string): string[] {
    const orderMatch = query.match(/order\s+by\s+(.+?)(?:\s+limit|$)/i);
    if (!orderMatch) return [];
    
    return orderMatch[1]
      .split(',')
      .map(col => col.trim().split(/\s+/)[0]);
  }

  private extractGroupColumns(query: string): string[] {
    const groupMatch = query.match(/group\s+by\s+(.+?)(?:\s+having|\s+order|\s+limit|$)/i);
    if (!groupMatch) return [];
    
    return groupMatch[1]
      .split(',')
      .map(col => col.trim());
  }

  private generateOptimizations(query: string, analysis: any): string[] {
    const optimizations: string[] = [];
    
    // Add LIMIT if missing and query might return many rows
    if (!analysis.hasLimit && !analysis.hasGroupBy) {
      optimizations.push('Consider adding LIMIT clause to prevent large result sets');
    }
    
    // Suggest specific columns instead of SELECT *
    if (query.includes('select *')) {
      optimizations.push('Use specific column names instead of SELECT *');
    }
    
    // Optimize WHERE clauses
    if (analysis.whereConditions.length > 1) {
      optimizations.push('Consider creating composite indexes for multiple WHERE conditions');
    }
    
    // Optimize JOINs
    if (analysis.hasJoin && analysis.joinTables.length > 2) {
      optimizations.push('Consider query decomposition for complex JOINs');
    }
    
    // Optimize ORDER BY
    if (analysis.hasOrderBy && !analysis.hasLimit) {
      optimizations.push('Consider adding LIMIT with ORDER BY for better performance');
    }
    
    return optimizations;
  }

  private recommendIndexes(query: string, analysis: any): IndexRecommendation[] {
    const recommendations: IndexRecommendation[] = [];
    
    // WHERE clause indexes
    if (analysis.hasWhere) {
      for (const condition of analysis.whereConditions) {
        recommendations.push({
          table: this.extractTableName(query),
          columns: [condition],
          type: 'btree',
          priority: 'high',
          reason: `Frequently used in WHERE clause`
        });
      }
    }
    
    // ORDER BY indexes
    if (analysis.hasOrderBy) {
      for (const column of analysis.orderColumns) {
        recommendations.push({
          table: this.extractTableName(query),
          columns: [column],
          type: 'btree',
          priority: 'medium',
          reason: `Used in ORDER BY clause`
        });
      }
    }
    
    // Composite indexes for WHERE + ORDER BY
    if (analysis.hasWhere && analysis.hasOrderBy) {
      const compositeColumns = [...analysis.whereConditions, ...analysis.orderColumns];
      if (compositeColumns.length <= 3) { // Limit composite index size
        recommendations.push({
          table: this.extractTableName(query),
          columns: compositeColumns,
          type: 'btree',
          priority: 'high',
          reason: `Composite index for WHERE + ORDER BY optimization`
        });
      }
    }
    
    return recommendations;
  }

  private extractTableName(query: string): string {
    const fromMatch = query.match(/from\s+(\w+)/i);
    return fromMatch ? fromMatch[1] : 'unknown';
  }

  private estimateCost(analysis: any): number {
    let cost = 100; // Base cost
    
    if (analysis.hasJoin) {
      cost += analysis.joinTables.length * 50;
    }
    
    if (analysis.hasWhere) {
      cost -= analysis.whereConditions.length * 20; // WHERE clauses reduce cost
    }
    
    if (analysis.hasOrderBy && !analysis.hasLimit) {
      cost += 100; // Sorting without limit is expensive
    }
    
    if (analysis.hasGroupBy) {
      cost += 150;
    }
    
    return Math.max(cost, 10);
  }

  private updateMetrics(query: string, executionTime: number): void {
    const existing = this.queryMetrics.get(query);
    
    if (existing) {
      existing.executionCount++;
      existing.totalTime += executionTime;
      existing.averageTime = existing.totalTime / existing.executionCount;
      existing.lastExecuted = new Date();
      
      if (executionTime > this.slowQueryThreshold) {
        existing.slowQueries++;
      }
    } else {
      this.queryMetrics.set(query, {
        query,
        executionCount: 1,
        averageTime: executionTime,
        totalTime: executionTime,
        slowQueries: executionTime > this.slowQueryThreshold ? 1 : 0,
        lastExecuted: new Date()
      });
    }
  }

  private getFrequentQueries(): string[] {
    return Array.from(this.queryMetrics.values())
      .filter(m => m.executionCount >= 5) // Queries executed at least 5 times
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, 20) // Top 20 most frequent queries
      .map(m => m.query);
  }

  private prioritizeRecommendations(recommendations: IndexRecommendation[]): IndexRecommendation[] {
    // Remove duplicates and prioritize
    const uniqueRecommendations = new Map<string, IndexRecommendation>();
    
    for (const rec of recommendations) {
      const key = `${rec.table}:${rec.columns.join(',')}`;
      
      if (!uniqueRecommendations.has(key) || 
          (rec.priority === 'high' && uniqueRecommendations.get(key)!.priority !== 'high')) {
        uniqueRecommendations.set(key, rec);
      }
    }
    
    return Array.from(uniqueRecommendations.values())
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }
}

/**
 * SQL Query Builder with Optimization
 */
export class OptimizedQueryBuilder {
  private query: string = '';
  private parameters: any[] = [];
  private table: string = '';
  private joins: string[] = [];
  private whereConditions: string[] = [];
  private orderBy: string[] = [];
  private groupBy: string[] = [];
  private havingConditions: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;

  select(columns: string[]): this {
    this.query = `SELECT ${columns.join(', ')}`;
    return this;
  }

  from(table: string): this {
    this.table = table;
    this.query += ` FROM ${table}`;
    return this;
  }

  join(table: string, condition: string, type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' = 'INNER'): this {
    this.joins.push(`${type} JOIN ${table} ON ${condition}`);
    return this;
  }

  where(condition: string, ...params: any[]): this {
    this.whereConditions.push(condition);
    this.parameters.push(...params);
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderBy.push(`${column} ${direction}`);
    return this;
  }

  groupBy(columns: string[]): this {
    this.groupBy.push(...columns);
    return this;
  }

  having(condition: string, ...params: any[]): this {
    this.havingConditions.push(condition);
    this.parameters.push(...params);
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  offset(count: number): this {
    this.offsetValue = count;
    return this;
  }

  build(): { query: string; parameters: any[] } {
    let finalQuery = this.query;
    
    // Add JOINs
    if (this.joins.length > 0) {
      finalQuery += ' ' + this.joins.join(' ');
    }
    
    // Add WHERE clause
    if (this.whereConditions.length > 0) {
      finalQuery += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }
    
    // Add GROUP BY
    if (this.groupBy.length > 0) {
      finalQuery += ` GROUP BY ${this.groupBy.join(', ')}`;
    }
    
    // Add HAVING
    if (this.havingConditions.length > 0) {
      finalQuery += ` HAVING ${this.havingConditions.join(' AND ')}`;
    }
    
    // Add ORDER BY
    if (this.orderBy.length > 0) {
      finalQuery += ` ORDER BY ${this.orderBy.join(', ')}`;
    }
    
    // Add LIMIT
    if (this.limitValue !== undefined) {
      finalQuery += ` LIMIT ${this.limitValue}`;
    }
    
    // Add OFFSET
    if (this.offsetValue !== undefined) {
      finalQuery += ` OFFSET ${this.offsetValue}`;
    }
    
    return {
      query: finalQuery,
      parameters: [...this.parameters]
    };
  }
}

/**
 * FabZClean Database Optimization
 */
export class FabZCleanDatabaseOptimizer {
  private queryOptimizer: DatabaseQueryOptimizer;
  private queryBuilder: OptimizedQueryBuilder;

  constructor() {
    this.queryOptimizer = new DatabaseQueryOptimizer();
    this.queryBuilder = new OptimizedQueryBuilder();
  }

  /**
   * Get optimized orders query
   */
  getOptimizedOrdersQuery(filters: {
    status?: string;
    customerId?: string;
    dateRange?: { start: Date; end: Date };
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
  } = {}): { query: string; parameters: any[] } {
    const builder = new OptimizedQueryBuilder();
    
    builder
      .select(['id', 'orderNumber', 'customerName', 'status', 'totalAmount', 'createdAt'])
      .from('orders');
    
    // Apply filters
    if (filters.status) {
      builder.where('status = ?', filters.status);
    }
    
    if (filters.customerId) {
      builder.where('customerId = ?', filters.customerId);
    }
    
    if (filters.dateRange) {
      builder.where('createdAt >= ?', filters.dateRange.start.toISOString());
      builder.where('createdAt <= ?', filters.dateRange.end.toISOString());
    }
    
    // Apply sorting
    if (filters.sortBy) {
      builder.orderBy(filters.sortBy, filters.sortDirection || 'DESC');
    } else {
      builder.orderBy('createdAt', 'DESC'); // Default sort
    }
    
    // Apply pagination
    if (filters.limit) {
      builder.limit(filters.limit);
    }
    
    if (filters.offset) {
      builder.offset(filters.offset);
    }
    
    return builder.build();
  }

  /**
   * Get optimized customers query
   */
  getOptimizedCustomersQuery(filters: {
    search?: string;
    minSpent?: number;
    limit?: number;
    offset?: number;
  } = {}): { query: string; parameters: any[] } {
    const builder = new OptimizedQueryBuilder();
    
    builder
      .select(['id', 'name', 'email', 'phone', 'totalOrders', 'totalSpent', 'lastOrder'])
      .from('customers');
    
    // Apply search filter
    if (filters.search) {
      builder.where('name LIKE ?', `%${filters.search}%`);
    }
    
    // Apply minimum spent filter
    if (filters.minSpent) {
      builder.where('totalSpent >= ?', filters.minSpent);
    }
    
    // Default sorting by total spent
    builder.orderBy('totalSpent', 'DESC');
    
    // Apply pagination
    if (filters.limit) {
      builder.limit(filters.limit);
    }
    
    if (filters.offset) {
      builder.offset(filters.offset);
    }
    
    return builder.build();
  }

  /**
   * Get optimized products query
   */
  getOptimizedProductsQuery(filters: {
    category?: string;
    inStock?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): { query: string; parameters: any[] } {
    const builder = new OptimizedQueryBuilder();
    
    builder
      .select(['id', 'name', 'sku', 'category', 'price', 'stockQuantity', 'supplier'])
      .from('products');
    
    // Apply filters
    if (filters.category) {
      builder.where('category = ?', filters.category);
    }
    
    if (filters.inStock) {
      builder.where('stockQuantity > ?', 0);
    }
    
    if (filters.search) {
      builder.where('name LIKE ?', `%${filters.search}%`);
    }
    
    // Default sorting by name
    builder.orderBy('name', 'ASC');
    
    // Apply pagination
    if (filters.limit) {
      builder.limit(filters.limit);
    }
    
    if (filters.offset) {
      builder.offset(filters.offset);
    }
    
    return builder.build();
  }

  /**
   * Analyze query performance
   */
  analyzeQuery(query: string, executionTime: number): QueryPlan {
    return this.queryOptimizer.analyzeQuery(query, executionTime);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return this.queryOptimizer.getPerformanceStats();
  }

  /**
   * Get index recommendations
   */
  getIndexRecommendations(): IndexRecommendation[] {
    return this.queryOptimizer.getIndexRecommendations();
  }

  /**
   * Generate database optimization report
   */
  generateOptimizationReport(): {
    performanceStats: any;
    indexRecommendations: IndexRecommendation[];
    queryOptimizations: string[];
  } {
    const performanceStats = this.getPerformanceStats();
    const indexRecommendations = this.getIndexRecommendations();
    
    const queryOptimizations = [
      'Use specific column names instead of SELECT *',
      'Add appropriate indexes for frequently queried columns',
      'Use LIMIT clauses to prevent large result sets',
      'Optimize JOIN operations by ensuring proper indexes',
      'Consider query decomposition for complex queries',
      'Use prepared statements to prevent SQL injection and improve performance',
      'Monitor and analyze slow queries regularly'
    ];
    
    return {
      performanceStats,
      indexRecommendations,
      queryOptimizations
    };
  }
}

// Global database optimizer instance
export const databaseOptimizer = new FabZCleanDatabaseOptimizer();
