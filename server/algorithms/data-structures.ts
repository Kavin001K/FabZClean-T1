/**
 * Advanced Data Structures for FabZClean
 * Optimized data structures for frequent operations
 */

/**
 * Trie Data Structure for Fast Prefix Search
 * Time Complexity: O(m) for search/insert where m is string length
 * Space Complexity: O(ALPHABET_SIZE * N * M) where N is number of strings, M is average length
 */
export class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord: boolean = false;
  data?: any; // Store associated data
  frequency: number = 0; // For frequency-based operations

  constructor(public char: string = '') {}
}

export class Trie {
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string, data?: any): void {
    let current = this.root;
    
    for (const char of word.toLowerCase()) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode(char));
      }
      current = current.children.get(char)!;
    }
    
    current.isEndOfWord = true;
    current.frequency++;
    if (data !== undefined) {
      current.data = data;
    }
  }

  search(word: string): boolean {
    const node = this.findNode(word);
    return node !== null && node.isEndOfWord;
  }

  searchWithData(word: string): any | null {
    const node = this.findNode(word);
    return (node && node.isEndOfWord) ? node.data : null;
  }

  findPrefix(prefix: string): string[] {
    const node = this.findNode(prefix);
    if (!node) return [];

    const results: string[] = [];
    this.dfs(node, prefix, results);
    return results;
  }

  findPrefixWithData(prefix: string): Array<{ word: string; data: any; frequency: number }> {
    const node = this.findNode(prefix);
    if (!node) return [];

    const results: Array<{ word: string; data: any; frequency: number }> = [];
    this.dfsWithData(node, prefix, results);
    
    // Sort by frequency (most frequent first)
    return results.sort((a, b) => b.frequency - a.frequency);
  }

  delete(word: string): boolean {
    return this.deleteHelper(this.root, word, 0);
  }

  private findNode(word: string): TrieNode | null {
    let current = this.root;
    
    for (const char of word.toLowerCase()) {
      if (!current.children.has(char)) {
        return null;
      }
      current = current.children.get(char)!;
    }
    
    return current;
  }

  private dfs(node: TrieNode, currentWord: string, results: string[]): void {
    if (node.isEndOfWord) {
      results.push(currentWord);
    }

    for (const [char, childNode] of node.children) {
      this.dfs(childNode, currentWord + char, results);
    }
  }

  private dfsWithData(
    node: TrieNode, 
    currentWord: string, 
    results: Array<{ word: string; data: any; frequency: number }>
  ): void {
    if (node.isEndOfWord) {
      results.push({
        word: currentWord,
        data: node.data,
        frequency: node.frequency
      });
    }

    for (const [char, childNode] of node.children) {
      this.dfsWithData(childNode, currentWord + char, results);
    }
  }

  private deleteHelper(node: TrieNode, word: string, index: number): boolean {
    if (index === word.length) {
      if (!node.isEndOfWord) return false;
      node.isEndOfWord = false;
      return node.children.size === 0;
    }

    const char = word[index].toLowerCase();
    const childNode = node.children.get(char);
    
    if (!childNode) return false;

    const shouldDeleteChild = this.deleteHelper(childNode, word, index + 1);

    if (shouldDeleteChild) {
      node.children.delete(char);
      return node.children.size === 0 && !node.isEndOfWord;
    }

    return false;
  }

  size(): number {
    return this.countWords(this.root);
  }

  private countWords(node: TrieNode): number {
    let count = node.isEndOfWord ? 1 : 0;
    
    for (const childNode of node.children.values()) {
      count += this.countWords(childNode);
    }
    
    return count;
  }
}

/**
 * Bloom Filter for Fast Membership Testing
 * Time Complexity: O(k) where k is number of hash functions
 * Space Complexity: O(m) where m is bit array size
 */
export class BloomFilter {
  private bitArray: boolean[];
  private hashFunctions: ((item: string) => number)[];
  private size: number;
  private hashCount: number;

  constructor(expectedItems: number, falsePositiveRate: number = 0.01) {
    this.size = this.calculateSize(expectedItems, falsePositiveRate);
    this.hashCount = this.calculateHashCount(expectedItems, this.size);
    this.bitArray = new Array(this.size).fill(false);
    this.hashFunctions = this.generateHashFunctions();
  }

  add(item: string): void {
    for (let i = 0; i < this.hashCount; i++) {
      const hash = this.hashFunctions[i](item);
      const index = Math.abs(hash) % this.size;
      this.bitArray[index] = true;
    }
  }

  mightContain(item: string): boolean {
    for (let i = 0; i < this.hashCount; i++) {
      const hash = this.hashFunctions[i](item);
      const index = Math.abs(hash) % this.size;
      
      if (!this.bitArray[index]) {
        return false;
      }
    }
    return true;
  }

  private calculateSize(expectedItems: number, falsePositiveRate: number): number {
    return Math.ceil(
      -(expectedItems * Math.log(falsePositiveRate)) / (Math.log(2) ** 2)
    );
  }

  private calculateHashCount(expectedItems: number, size: number): number {
    return Math.ceil((size / expectedItems) * Math.log(2));
  }

  private generateHashFunctions(): ((item: string) => number)[] {
    const functions: ((item: string) => number)[] = [];
    
    for (let i = 0; i < this.hashCount; i++) {
      functions.push((item: string) => {
        let hash = 0;
        for (let j = 0; j < item.length; j++) {
          hash = ((hash << 5) - hash + item.charCodeAt(j) + i) & 0xffffffff;
        }
        return hash;
      });
    }
    
    return functions;
  }
}

/**
 * Segment Tree for Range Queries
 * Time Complexity: O(log n) for range queries and updates
 * Space Complexity: O(n)
 */
export class SegmentTree {
  private tree: number[];
  private n: number;

  constructor(arr: number[]) {
    this.n = arr.length;
    this.tree = new Array(4 * this.n);
    this.build(arr, 0, 0, this.n - 1);
  }

  private build(arr: number[], node: number, start: number, end: number): void {
    if (start === end) {
      this.tree[node] = arr[start];
    } else {
      const mid = Math.floor((start + end) / 2);
      this.build(arr, 2 * node + 1, start, mid);
      this.build(arr, 2 * node + 2, mid + 1, end);
      this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2];
    }
  }

  update(index: number, value: number): void {
    this.updateHelper(0, 0, this.n - 1, index, value);
  }

  private updateHelper(node: number, start: number, end: number, index: number, value: number): void {
    if (start === end) {
      this.tree[node] = value;
    } else {
      const mid = Math.floor((start + end) / 2);
      
      if (index <= mid) {
        this.updateHelper(2 * node + 1, start, mid, index, value);
      } else {
        this.updateHelper(2 * node + 2, mid + 1, end, index, value);
      }
      
      this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2];
    }
  }

  rangeQuery(left: number, right: number): number {
    return this.rangeQueryHelper(0, 0, this.n - 1, left, right);
  }

  private rangeQueryHelper(node: number, start: number, end: number, left: number, right: number): number {
    if (right < start || left > end) {
      return 0;
    }
    
    if (left <= start && right >= end) {
      return this.tree[node];
    }
    
    const mid = Math.floor((start + end) / 2);
    const leftSum = this.rangeQueryHelper(2 * node + 1, start, mid, left, right);
    const rightSum = this.rangeQueryHelper(2 * node + 2, mid + 1, end, left, right);
    
    return leftSum + rightSum;
  }
}

/**
 * Disjoint Set Union (Union-Find) for Connected Components
 * Time Complexity: O(α(n)) per operation where α is inverse Ackermann function
 * Space Complexity: O(n)
 */
export class UnionFind {
  private parent: number[];
  private rank: number[];
  private size: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.size = new Array(n).fill(1);
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // Path compression
    }
    return this.parent[x];
  }

  union(x: number, y: number): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false;

    // Union by rank
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
      this.size[rootY] += this.size[rootX];
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
      this.size[rootX] += this.size[rootY];
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
      this.size[rootX] += this.size[rootY];
    }

    return true;
  }

  isConnected(x: number, y: number): boolean {
    return this.find(x) === this.find(y);
  }

  getComponentSize(x: number): number {
    return this.size[this.find(x)];
  }

  getComponents(): number[][] {
    const components: { [root: number]: number[] } = {};
    
    for (let i = 0; i < this.parent.length; i++) {
      const root = this.find(i);
      if (!components[root]) {
        components[root] = [];
      }
      components[root].push(i);
    }
    
    return Object.values(components);
  }
}

/**
 * Circular Buffer for Fixed-Size Collections
 * Time Complexity: O(1) for insert/remove operations
 * Space Complexity: O(n)
 */
export class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;

  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    
    if (this.count < this.capacity) {
      this.count++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }

  pop(): T | undefined {
    if (this.count === 0) return undefined;
    
    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    
    return item;
  }

  peek(): T | undefined {
    return this.count > 0 ? this.buffer[this.head] : undefined;
  }

  size(): number {
    return this.count;
  }

  isFull(): boolean {
    return this.count === this.capacity;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  toArray(): T[] {
    const result: T[] = [];
    
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.capacity;
      const item = this.buffer[index];
      if (item !== undefined) {
        result.push(item);
      }
    }
    
    return result;
  }

  clear(): void {
    this.buffer.fill(undefined);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }
}

/**
 * Priority Queue with Custom Comparator
 * Time Complexity: O(log n) for insert/extract operations
 * Space Complexity: O(n)
 */
export class PriorityQueue<T> {
  private heap: T[];
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.heap = [];
    this.compare = compare;
  }

  push(item: T): void {
    this.heap.push(item);
    this.heapifyUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    
    if (this.heap.length === 1) {
      return this.heap.pop();
    }
    
    const root = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.heapifyDown(0);
    
    return root;
  }

  peek(): T | undefined {
    return this.heap.length > 0 ? this.heap[0] : undefined;
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private heapifyUp(index: number): void {
    if (index === 0) return;
    
    const parentIndex = Math.floor((index - 1) / 2);
    
    if (this.compare(this.heap[index], this.heap[parentIndex]) < 0) {
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      this.heapifyUp(parentIndex);
    }
  }

  private heapifyDown(index: number): void {
    const leftChild = 2 * index + 1;
    const rightChild = 2 * index + 2;
    let smallest = index;
    
    if (leftChild < this.heap.length && 
        this.compare(this.heap[leftChild], this.heap[smallest]) < 0) {
      smallest = leftChild;
    }
    
    if (rightChild < this.heap.length && 
        this.compare(this.heap[rightChild], this.heap[smallest]) < 0) {
      smallest = rightChild;
    }
    
    if (smallest !== index) {
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      this.heapifyDown(smallest);
    }
  }
}

/**
 * Specialized Data Structures for FabZClean
 */
export class FabZCleanDataStructures {
  // Customer name search trie
  private customerTrie = new Trie();
  
  // Product search trie
  private productTrie = new Trie();
  
  // Order ID bloom filter for fast existence check
  private orderBloomFilter = new BloomFilter(10000, 0.01);
  
  // Recent orders circular buffer
  private recentOrders = new CircularBuffer<any>(100);
  
  // Priority queue for urgent orders
  private urgentOrders = new PriorityQueue<any>((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  addCustomer(customer: any): void {
    this.customerTrie.insert(customer.name, customer);
  }

  searchCustomers(prefix: string): any[] {
    return this.customerTrie.findPrefixWithData(prefix).map(item => item.data);
  }

  addProduct(product: any): void {
    this.productTrie.insert(product.name, product);
    if (product.sku) {
      this.productTrie.insert(product.sku, product);
    }
  }

  searchProducts(query: string): any[] {
    const results = this.productTrie.findPrefixWithData(query);
    const uniqueProducts = new Map();
    
    results.forEach(item => {
      if (!uniqueProducts.has(item.data.id)) {
        uniqueProducts.set(item.data.id, item.data);
      }
    });
    
    return Array.from(uniqueProducts.values());
  }

  addOrder(order: any): void {
    this.orderBloomFilter.add(order.id);
    this.recentOrders.push(order);
    
    if (order.priority === 'high') {
      this.urgentOrders.push(order);
    }
  }

  mightHaveOrder(orderId: string): boolean {
    return this.orderBloomFilter.mightContain(orderId);
  }

  getRecentOrders(): any[] {
    return this.recentOrders.toArray();
  }

  getNextUrgentOrder(): any | undefined {
    return this.urgentOrders.pop();
  }

  getUrgentOrdersCount(): number {
    return this.urgentOrders.size();
  }

  clear(): void {
    this.customerTrie = new Trie();
    this.productTrie = new Trie();
    this.orderBloomFilter = new BloomFilter(10000, 0.01);
    this.recentOrders.clear();
    this.urgentOrders = new PriorityQueue<any>((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}

// Global data structures instance
export const fabzCleanDataStructures = new FabZCleanDataStructures();
