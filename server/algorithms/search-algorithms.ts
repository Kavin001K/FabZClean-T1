/**
 * Advanced Search Algorithms for FabZClean
 * Implements multiple search strategies optimized for different use cases
 */

export interface SearchResult<T> {
  item: T;
  score: number;
  matchedFields: string[];
  highlights: { [field: string]: string };
}

export interface SearchOptions {
  fields: string[];
  weights?: { [field: string]: number };
  threshold?: number;
  limit?: number;
  fuzzy?: boolean;
  caseSensitive?: boolean;
}

/**
 * Levenshtein Distance Algorithm for Fuzzy String Matching
 * Time Complexity: O(m*n) where m, n are string lengths
 * Space Complexity: O(m*n)
 */
export class LevenshteinDistance {
  static calculate(str1: string, str2: string): number {
    const matrix: number[][] = [];
    const len1 = str1.length;
    const len2 = str2.length;

    // Initialize matrix
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        const cost = str1[j - 1] === str2[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len2][len1];
  }

  static similarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    return 1 - (this.calculate(str1, str2) / maxLength);
  }
}

/**
 * Boyer-Moore String Matching Algorithm
 * Time Complexity: O(n/m) average case, O(n*m) worst case
 * Space Complexity: O(σ) where σ is alphabet size
 */
export class BoyerMooreSearch {
  private static buildBadCharTable(pattern: string): Map<string, number> {
    const table = new Map<string, number>();
    for (let i = 0; i < pattern.length; i++) {
      table.set(pattern[i], i);
    }
    return table;
  }

  static search(text: string, pattern: string): number[] {
    const results: number[] = [];
    const badCharTable = this.buildBadCharTable(pattern);
    const patternLen = pattern.length;
    const textLen = text.length;

    let shift = 0;
    while (shift <= textLen - patternLen) {
      let j = patternLen - 1;

      // Keep reducing j while characters match
      while (j >= 0 && pattern[j] === text[shift + j]) {
        j--;
      }

      if (j < 0) {
        // Pattern found
        results.push(shift);
        shift += (shift + patternLen < textLen) 
          ? patternLen - (badCharTable.get(text[shift + patternLen]) ?? -1)
          : 1;
      } else {
        // Shift based on bad character rule
        const badCharShift = badCharTable.get(text[shift + j]) ?? -1;
        shift += Math.max(1, j - badCharShift);
      }
    }

    return results;
  }
}

/**
 * Knuth-Morris-Pratt (KMP) Algorithm for Pattern Matching
 * Time Complexity: O(n + m) where n is text length, m is pattern length
 * Space Complexity: O(m)
 */
export class KMPSearch {
  private static buildLPSArray(pattern: string): number[] {
    const lps: number[] = new Array(pattern.length).fill(0);
    let len = 0;
    let i = 1;

    while (i < pattern.length) {
      if (pattern[i] === pattern[len]) {
        len++;
        lps[i] = len;
        i++;
      } else {
        if (len !== 0) {
          len = lps[len - 1];
        } else {
          lps[i] = 0;
          i++;
        }
      }
    }

    return lps;
  }

  static search(text: string, pattern: string): number[] {
    const results: number[] = [];
    const lps = this.buildLPSArray(pattern);
    const textLen = text.length;
    const patternLen = pattern.length;

    let i = 0; // index for text
    let j = 0; // index for pattern

    while (i < textLen) {
      if (pattern[j] === text[i]) {
        i++;
        j++;
      }

      if (j === patternLen) {
        results.push(i - j);
        j = lps[j - 1];
      } else if (i < textLen && pattern[j] !== text[i]) {
        if (j !== 0) {
          j = lps[j - 1];
        } else {
          i++;
        }
      }
    }

    return results;
  }
}

/**
 * Advanced Search Engine with Multiple Algorithms
 * Combines fuzzy matching, exact matching, and weighted scoring
 */
export class AdvancedSearchEngine<T> {
  private data: T[] = [];
  private index: Map<string, Set<number>> = new Map();
  private fieldWeights: Map<string, number> = new Map();

  constructor(data: T[] = []) {
    this.data = data;
    this.buildIndex();
  }

  /**
   * Build inverted index for fast exact matching
   * Time Complexity: O(n * m) where n is data size, m is average field length
   */
  private buildIndex(): void {
    this.index.clear();
    
    this.data.forEach((item, idx) => {
      const searchableText = this.extractSearchableText(item);
      const words = searchableText.toLowerCase().split(/\s+/);
      
      words.forEach(word => {
        if (word.length > 2) { // Ignore short words
          if (!this.index.has(word)) {
            this.index.set(word, new Set());
          }
          this.index.get(word)!.add(idx);
        }
      });
    });
  }

  /**
   * Extract searchable text from object
   */
  private extractSearchableText(item: T): string {
    const textParts: string[] = [];
    
    Object.entries(item as any).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        textParts.push(String(value));
      }
    });
    
    return textParts.join(' ');
  }

  /**
   * Set field weights for scoring
   */
  setFieldWeights(weights: { [field: string]: number }): void {
    this.fieldWeights.clear();
    Object.entries(weights).forEach(([field, weight]) => {
      this.fieldWeights.set(field, weight);
    });
  }

  /**
   * Perform advanced search with multiple algorithms
   * Time Complexity: O(n * log n) for sorting results
   */
  search(query: string, options: SearchOptions): SearchResult<T>[] {
    const results: SearchResult<T>[] = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);

    // Phase 1: Exact matches using inverted index
    const exactMatches = this.findExactMatches(queryWords);
    
    // Phase 2: Fuzzy matches for non-exact results
    const fuzzyMatches = options.fuzzy 
      ? this.findFuzzyMatches(query, options.threshold || 0.6)
      : new Map<number, number>();

    // Phase 3: Combine and score results
    const allMatches = new Set([...exactMatches.keys(), ...fuzzyMatches.keys()]);
    
    allMatches.forEach(index => {
      const item = this.data[index];
      const exactScore = exactMatches.get(index) || 0;
      const fuzzyScore = fuzzyMatches.get(index) || 0;
      const combinedScore = Math.max(exactScore, fuzzyScore);

      if (combinedScore >= (options.threshold || 0.1)) {
        const result = this.createSearchResult(
          item, 
          combinedScore, 
          query, 
          options
        );
        results.push(result);
      }
    });

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    return options.limit ? results.slice(0, options.limit) : results;
  }

  /**
   * Find exact matches using inverted index
   * Time Complexity: O(k) where k is number of query words
   */
  private findExactMatches(queryWords: string[]): Map<number, number> {
    const matches = new Map<number, number>();
    
    if (queryWords.length === 0) return matches;

    // Start with first word matches
    const firstWordMatches = this.index.get(queryWords[0]) || new Set();
    
    queryWords.forEach((word, wordIndex) => {
      const wordMatches = this.index.get(word) || new Set();
      
      wordMatches.forEach(index => {
        const currentScore = matches.get(index) || 0;
        const wordWeight = 1 / (wordIndex + 1); // Earlier words have higher weight
        matches.set(index, currentScore + wordWeight);
      });
    });

    return matches;
  }

  /**
   * Find fuzzy matches using Levenshtein distance
   * Time Complexity: O(n * m * k) where n is data size, m is average field length, k is query length
   */
  private findFuzzyMatches(query: string, threshold: number): Map<number, number> {
    const matches = new Map<number, number>();
    
    this.data.forEach((item, index) => {
      const searchableText = this.extractSearchableText(item);
      const similarity = LevenshteinDistance.similarity(query, searchableText);
      
      if (similarity >= threshold) {
        matches.set(index, similarity);
      }
    });

    return matches;
  }

  /**
   * Create search result with highlights
   */
  private createSearchResult(
    item: T, 
    score: number, 
    query: string, 
    options: SearchOptions
  ): SearchResult<T> {
    const highlights: { [field: string]: string } = {};
    const matchedFields: string[] = [];
    
    // Find matches in each field
    options.fields.forEach(field => {
      const fieldValue = (item as any)[field];
      if (typeof fieldValue === 'string') {
        const positions = BoyerMooreSearch.search(fieldValue.toLowerCase(), query.toLowerCase());
        if (positions.length > 0) {
          matchedFields.push(field);
          highlights[field] = this.highlightText(fieldValue, positions, query.length);
        }
      }
    });

    return {
      item,
      score: this.calculateWeightedScore(score, matchedFields),
      matchedFields,
      highlights
    };
  }

  /**
   * Calculate weighted score based on field importance
   */
  private calculateWeightedScore(baseScore: number, matchedFields: string[]): number {
    let weightedScore = baseScore;
    
    matchedFields.forEach(field => {
      const fieldWeight = this.fieldWeights.get(field) || 1;
      weightedScore *= fieldWeight;
    });

    return weightedScore;
  }

  /**
   * Highlight matched text
   */
  private highlightText(text: string, positions: number[], queryLength: number): string {
    let highlighted = text;
    let offset = 0;

    positions.forEach(pos => {
      const start = pos + offset;
      const end = start + queryLength;
      const before = highlighted.substring(0, start);
      const match = highlighted.substring(start, end);
      const after = highlighted.substring(end);
      
      highlighted = before + `<mark>${match}</mark>` + after;
      offset += 13; // Length of <mark></mark> tags
    });

    return highlighted;
  }

  /**
   * Update data and rebuild index
   */
  updateData(newData: T[]): void {
    this.data = newData;
    this.buildIndex();
  }

  /**
   * Add single item to data
   */
  addItem(item: T): void {
    this.data.push(item);
    // Rebuild index for simplicity (could be optimized with incremental updates)
    this.buildIndex();
  }

  /**
   * Remove item from data
   */
  removeItem(index: number): void {
    if (index >= 0 && index < this.data.length) {
      this.data.splice(index, 1);
      this.buildIndex();
    }
  }
}

/**
 * Specialized search engines for different data types
 */
export class OrderSearchEngine extends AdvancedSearchEngine<any> {
  constructor(orders: any[] = []) {
    super(orders);
    this.setFieldWeights({
      orderNumber: 3.0,
      customerName: 2.5,
      customerEmail: 2.0,
      customerPhone: 1.5,
      status: 1.0
    });
  }

  searchOrders(query: string, limit: number = 20): SearchResult<any>[] {
    return this.search(query, {
      fields: ['orderNumber', 'customerName', 'customerEmail', 'customerPhone', 'status'],
      limit,
      fuzzy: true,
      threshold: 0.3
    });
  }
}

export class CustomerSearchEngine extends AdvancedSearchEngine<any> {
  constructor(customers: any[] = []) {
    super(customers);
    this.setFieldWeights({
      name: 3.0,
      email: 2.5,
      phone: 2.0,
      address: 1.0
    });
  }

  searchCustomers(query: string, limit: number = 20): SearchResult<any>[] {
    return this.search(query, {
      fields: ['name', 'email', 'phone', 'address'],
      limit,
      fuzzy: true,
      threshold: 0.4
    });
  }
}

export class ProductSearchEngine extends AdvancedSearchEngine<any> {
  constructor(products: any[] = []) {
    super(products);
    this.setFieldWeights({
      name: 3.0,
      sku: 2.5,
      category: 2.0,
      description: 1.0,
      supplier: 1.0
    });
  }

  searchProducts(query: string, limit: number = 20): SearchResult<any>[] {
    return this.search(query, {
      fields: ['name', 'sku', 'category', 'description', 'supplier'],
      limit,
      fuzzy: true,
      threshold: 0.3
    });
  }
}
