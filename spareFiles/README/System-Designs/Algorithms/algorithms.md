# Algorithms & Data Structures Documentation

## 🧮 Core Algorithms

### 1. Recommendation Algorithm

#### Collaborative Filtering Algorithm
```typescript
interface CollaborativeFiltering {
  // User-Item Matrix
  userItemMatrix: Map<string, Map<string, number>>;
  
  // Calculate User Similarity (Cosine Similarity)
  calculateUserSimilarity(user1: string, user2: string): number {
    const user1Ratings = this.userItemMatrix.get(user1);
    const user2Ratings = this.userItemMatrix.get(user2);
    
    if (!user1Ratings || !user2Ratings) return 0;
    
    const commonItems = this.getCommonItems(user1Ratings, user2Ratings);
    if (commonItems.length === 0) return 0;
    
    const dotProduct = this.calculateDotProduct(user1Ratings, user2Ratings, commonItems);
    const magnitude1 = this.calculateMagnitude(user1Ratings, commonItems);
    const magnitude2 = this.calculateMagnitude(user2Ratings, commonItems);
    
    return dotProduct / (magnitude1 * magnitude2);
  }
  
  // Get Recommendations for User
  getRecommendations(userId: string, limit: number = 10): Video[] {
    const userRatings = this.userItemMatrix.get(userId);
    if (!userRatings) return [];
    
    const similarUsers = this.findSimilarUsers(userId, 50);
    const recommendations = new Map<string, number>();
    
    for (const [similarUserId, similarity] of similarUsers) {
      const similarUserRatings = this.userItemMatrix.get(similarUserId);
      if (!similarUserRatings) continue;
      
      for (const [videoId, rating] of similarUserRatings) {
        if (!userRatings.has(videoId)) {
          const currentScore = recommendations.get(videoId) || 0;
          recommendations.set(videoId, currentScore + (rating * similarity));
        }
      }
    }
    
    return this.sortRecommendations(recommendations, limit);
  }
}
```

#### Content-Based Filtering Algorithm
```typescript
interface ContentBasedFiltering {
  // Video Feature Vector
  videoFeatures: Map<string, number[]>;
  
  // Calculate Video Similarity (Euclidean Distance)
  calculateVideoSimilarity(video1: string, video2: string): number {
    const features1 = this.videoFeatures.get(video1);
    const features2 = this.videoFeatures.get(video2);
    
    if (!features1 || !features2) return 0;
    
    const distance = this.calculateEuclideanDistance(features1, features2);
    return 1 / (1 + distance); // Convert distance to similarity
  }
  
  // Get Content-Based Recommendations
  getContentRecommendations(userId: string, limit: number = 10): Video[] {
    const userHistory = this.getUserWatchHistory(userId);
    const userPreferences = this.extractUserPreferences(userHistory);
    
    const recommendations = new Map<string, number>();
    
    for (const [videoId, features] of this.videoFeatures) {
      if (!userHistory.has(videoId)) {
        const similarity = this.calculatePreferenceSimilarity(userPreferences, features);
        recommendations.set(videoId, similarity);
      }
    }
    
    return this.sortRecommendations(recommendations, limit);
  }
}
```

### 2. Search Algorithm

#### Elasticsearch Query Algorithm
```typescript
interface SearchAlgorithm {
  // Multi-Match Query with Boosting
  buildSearchQuery(query: string, filters: SearchFilters): any {
    const searchTerms = this.parseSearchQuery(query);
    const boostedFields = [
      'title^3',           // Title has highest weight
      'description^2',     // Description has medium weight
      'tags^2',           // Tags have medium weight
      'category^1',        // Category has low weight
      'channel_name^1'    // Channel name has low weight
    ];
    
    return {
      bool: {
        must: [
          {
            multi_match: {
              query: searchTerms.join(' '),
              fields: boostedFields,
              type: 'best_fields',
              fuzziness: 'AUTO'
            }
          }
        ],
        filter: this.buildFilters(filters),
        should: [
          // Boost recent videos
          {
            range: {
              published_at: {
                gte: 'now-30d/d',
                boost: 1.2
              }
            }
          },
          // Boost popular videos
          {
            range: {
              view_count: {
                gte: 1000,
                boost: 1.1
              }
            }
          }
        ]
      }
    };
  }
  
  // Query Expansion Algorithm
  expandQuery(query: string): string[] {
    const synonyms = this.getSynonyms(query);
    const relatedTerms = this.getRelatedTerms(query);
    const trendingTerms = this.getTrendingTerms(query);
    
    return [query, ...synonyms, ...relatedTerms, ...trendingTerms];
  }
}
```

### 3. Trending Algorithm

#### Trending Score Calculation
```typescript
interface TrendingAlgorithm {
  // Calculate Trending Score
  calculateTrendingScore(video: Video, timeWindow: number = 24): number {
    const now = Date.now();
    const timeWindowMs = timeWindow * 60 * 60 * 1000; // Convert hours to milliseconds
    
    // View velocity (views per hour)
    const viewVelocity = this.calculateViewVelocity(video, timeWindowMs);
    
    // Engagement rate
    const engagementRate = this.calculateEngagementRate(video, timeWindowMs);
    
    // Freshness factor (newer videos get boost)
    const freshnessFactor = this.calculateFreshnessFactor(video.published_at, now);
    
    // Category boost (some categories trend more)
    const categoryBoost = this.getCategoryBoost(video.category_id);
    
    // Final trending score
    return (
      viewVelocity * 0.4 +
      engagementRate * 0.3 +
      freshnessFactor * 0.2 +
      categoryBoost * 0.1
    );
  }
  
  // View Velocity Calculation
  calculateViewVelocity(video: Video, timeWindowMs: number): number {
    const recentViews = this.getRecentViews(video.id, timeWindowMs);
    const hoursInWindow = timeWindowMs / (60 * 60 * 1000);
    return recentViews / hoursInWindow;
  }
  
  // Engagement Rate Calculation
  calculateEngagementRate(video: Video, timeWindowMs: number): number {
    const recentEngagement = this.getRecentEngagement(video.id, timeWindowMs);
    const recentViews = this.getRecentViews(video.id, timeWindowMs);
    
    if (recentViews === 0) return 0;
    return recentEngagement / recentViews;
  }
}
```

## 📊 Data Structures

### 1. Efficient Data Structures

#### Trie for Autocomplete
```typescript
class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord: boolean = false;
  frequency: number = 0;
  suggestions: string[] = [];
}

class AutocompleteTrie {
  private root: TrieNode = new TrieNode();
  
  // Insert a word into the trie
  insert(word: string, frequency: number = 1): void {
    let node = this.root;
    
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    
    node.isEndOfWord = true;
    node.frequency += frequency;
  }
  
  // Get suggestions for a prefix
  getSuggestions(prefix: string, limit: number = 10): string[] {
    let node = this.root;
    
    // Navigate to the prefix node
    for (const char of prefix.toLowerCase()) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char)!;
    }
    
    // Collect all words with this prefix
    const suggestions: { word: string; frequency: number }[] = [];
    this.collectWords(node, prefix, suggestions);
    
    // Sort by frequency and return top suggestions
    return suggestions
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit)
      .map(item => item.word);
  }
  
  private collectWords(node: TrieNode, prefix: string, suggestions: { word: string; frequency: number }[]): void {
    if (node.isEndOfWord) {
      suggestions.push({ word: prefix, frequency: node.frequency });
    }
    
    for (const [char, childNode] of node.children) {
      this.collectWords(childNode, prefix + char, suggestions);
    }
  }
}
```

#### LRU Cache Implementation
```typescript
class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V> = new Map();
  
  constructor(capacity: number) {
    this.capacity = capacity;
  }
  
  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!;
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }
  
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing key
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }
  
  has(key: K): boolean {
    return this.cache.has(key);
  }
  
  delete(key: K): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}
```

#### Bloom Filter for Duplicate Detection
```typescript
class BloomFilter {
  private bitArray: boolean[];
  private hashFunctions: ((item: string) => number)[];
  private size: number;
  private hashCount: number;
  
  constructor(size: number, hashCount: number) {
    this.size = size;
    this.hashCount = hashCount;
    this.bitArray = new Array(size).fill(false);
    this.hashFunctions = this.generateHashFunctions(hashCount);
  }
  
  add(item: string): void {
    for (const hashFunc of this.hashFunctions) {
      const index = hashFunc(item) % this.size;
      this.bitArray[index] = true;
    }
  }
  
  mightContain(item: string): boolean {
    for (const hashFunc of this.hashFunctions) {
      const index = hashFunc(item) % this.size;
      if (!this.bitArray[index]) {
        return false;
      }
    }
    return true;
  }
  
  private generateHashFunctions(count: number): ((item: string) => number)[] {
    const functions: ((item: string) => number)[] = [];
    
    for (let i = 0; i < count; i++) {
      functions.push((item: string) => {
        let hash = 0;
        for (let j = 0; j < item.length; j++) {
          hash = ((hash << 5) - hash + item.charCodeAt(j) + i) & 0xffffffff;
        }
        return Math.abs(hash);
      });
    }
    
    return functions;
  }
}
```

### 2. Graph Algorithms

#### Social Graph for Recommendations
```typescript
class SocialGraph {
  private adjacencyList: Map<string, Set<string>> = new Map();
  
  // Add edge between users (subscription, interaction)
  addEdge(user1: string, user2: string): void {
    if (!this.adjacencyList.has(user1)) {
      this.adjacencyList.set(user1, new Set());
    }
    if (!this.adjacencyList.has(user2)) {
      this.adjacencyList.set(user2, new Set());
    }
    
    this.adjacencyList.get(user1)!.add(user2);
    this.adjacencyList.get(user2)!.add(user1);
  }
  
  // Find shortest path between users
  findShortestPath(start: string, end: string): string[] {
    const queue: string[] = [start];
    const visited: Set<string> = new Set([start]);
    const parent: Map<string, string> = new Map();
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current === end) {
        return this.reconstructPath(parent, start, end);
      }
      
      const neighbors = this.adjacencyList.get(current) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }
    
    return []; // No path found
  }
  
  // Find users within N degrees of separation
  findUsersWithinDegrees(userId: string, degrees: number): string[] {
    const result: string[] = [];
    const visited: Set<string> = new Set();
    const queue: { user: string; degree: number }[] = [{ user: userId, degree: 0 }];
    
    while (queue.length > 0) {
      const { user, degree } = queue.shift()!;
      
      if (degree > degrees) break;
      
      if (!visited.has(user)) {
        visited.add(user);
        if (degree > 0) {
          result.push(user);
        }
        
        const neighbors = this.adjacencyList.get(user) || new Set();
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push({ user: neighbor, degree: degree + 1 });
          }
        }
      }
    }
    
    return result;
  }
  
  private reconstructPath(parent: Map<string, string>, start: string, end: string): string[] {
    const path: string[] = [];
    let current = end;
    
    while (current !== start) {
      path.unshift(current);
      current = parent.get(current)!;
    }
    
    path.unshift(start);
    return path;
  }
}
```

### 3. Sorting and Ranking Algorithms

#### Merge Sort for Large Datasets
```typescript
class MergeSort {
  static sort<T>(array: T[], compareFn: (a: T, b: T) => number): T[] {
    if (array.length <= 1) return array;
    
    const mid = Math.floor(array.length / 2);
    const left = this.sort(array.slice(0, mid), compareFn);
    const right = this.sort(array.slice(mid), compareFn);
    
    return this.merge(left, right, compareFn);
  }
  
  private static merge<T>(left: T[], right: T[], compareFn: (a: T, b: T) => number): T[] {
    const result: T[] = [];
    let leftIndex = 0;
    let rightIndex = 0;
    
    while (leftIndex < left.length && rightIndex < right.length) {
      if (compareFn(left[leftIndex], right[rightIndex]) <= 0) {
        result.push(left[leftIndex]);
        leftIndex++;
      } else {
        result.push(right[rightIndex]);
        rightIndex++;
      }
    }
    
    return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
  }
}
```

#### Quick Sort for In-Memory Sorting
```typescript
class QuickSort {
  static sort<T>(array: T[], compareFn: (a: T, b: T) => number): T[] {
    if (array.length <= 1) return array;
    
    const pivot = array[Math.floor(array.length / 2)];
    const left = array.filter(item => compareFn(item, pivot) < 0);
    const middle = array.filter(item => compareFn(item, pivot) === 0);
    const right = array.filter(item => compareFn(item, pivot) > 0);
    
    return [
      ...this.sort(left, compareFn),
      ...middle,
      ...this.sort(right, compareFn)
    ];
  }
}
```

## 🔧 Performance Optimization Algorithms

### 1. Database Query Optimization

#### Query Optimization Algorithm
```typescript
interface QueryOptimizer {
  // Analyze query execution plan
  analyzeQuery(query: string): QueryPlan {
    const plan = this.generateExecutionPlan(query);
    const cost = this.calculateCost(plan);
    const alternatives = this.generateAlternatives(query);
    
    return {
      originalPlan: plan,
      cost: cost,
      alternatives: alternatives,
      recommendedPlan: this.selectBestPlan(alternatives)
    };
  }
  
  // Index recommendation
  recommendIndexes(query: string): IndexRecommendation[] {
    const columns = this.extractColumns(query);
    const selectivity = this.calculateSelectivity(columns);
    const usage = this.calculateUsage(columns);
    
    return columns.map(column => ({
      column: column,
      type: this.determineIndexType(column),
      priority: this.calculatePriority(selectivity, usage),
      estimatedBenefit: this.estimateBenefit(column)
    }));
  }
}
```

### 2. Caching Algorithms

#### Cache Replacement Policies
```typescript
// Least Recently Used (LRU)
class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V> = new Map();
  
  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }
  
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// Least Frequently Used (LFU)
class LFUCache<K, V> {
  private capacity: number;
  private cache: Map<K, { value: V; frequency: number }> = new Map();
  
  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      const item = this.cache.get(key)!;
      item.frequency++;
      return item.value;
    }
    return undefined;
  }
  
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      const item = this.cache.get(key)!;
      item.value = value;
      item.frequency++;
    } else {
      if (this.cache.size >= this.capacity) {
        this.evictLeastFrequent();
      }
      this.cache.set(key, { value, frequency: 1 });
    }
  }
  
  private evictLeastFrequent(): void {
    let minFreq = Infinity;
    let keyToEvict: K | null = null;
    
    for (const [key, item] of this.cache) {
      if (item.frequency < minFreq) {
        minFreq = item.frequency;
        keyToEvict = key;
      }
    }
    
    if (keyToEvict !== null) {
      this.cache.delete(keyToEvict);
    }
  }
}
```

## 📈 Machine Learning Algorithms

### 1. Content Recommendation ML Model
```typescript
interface MLRecommendationModel {
  // Feature Engineering
  extractFeatures(video: Video, user: User): number[] {
    return [
      // Video features
      video.duration,
      video.view_count,
      video.like_count,
      video.category_id,
      
      // User features
      user.watch_history.length,
      user.subscription_count,
      user.account_age,
      
      // Interaction features
      this.calculateUserVideoInteraction(user.id, video.id),
      this.calculateTimeBasedFeatures(video.published_at),
      this.calculateContentSimilarity(user.preferences, video)
    ];
  }
  
  // Train model
  trainModel(trainingData: TrainingExample[]): void {
    const features = trainingData.map(example => example.features);
    const labels = trainingData.map(example => example.label);
    
    // Use gradient boosting or neural network
    this.model = this.trainGradientBoosting(features, labels);
  }
  
  // Predict user preference
  predictPreference(user: User, video: Video): number {
    const features = this.extractFeatures(video, user);
    return this.model.predict(features);
  }
}
```

### 2. Anomaly Detection Algorithm
```typescript
interface AnomalyDetection {
  // Statistical anomaly detection
  detectAnomalies(data: number[], threshold: number = 2): number[] {
    const mean = this.calculateMean(data);
    const stdDev = this.calculateStandardDeviation(data, mean);
    
    return data
      .map((value, index) => ({ value, index }))
      .filter(item => Math.abs(item.value - mean) > threshold * stdDev)
      .map(item => item.index);
  }
  
  // Isolation Forest for complex anomalies
  isolationForest(data: number[][], contamination: number = 0.1): number[] {
    const forest = this.buildIsolationForest(data);
    const scores = data.map(point => this.calculateAnomalyScore(point, forest));
    const threshold = this.calculateThreshold(scores, contamination);
    
    return scores
      .map((score, index) => ({ score, index }))
      .filter(item => item.score > threshold)
      .map(item => item.index);
  }
}
```

---

*This algorithms documentation provides comprehensive coverage of the core algorithms, data structures, and optimization techniques needed to build a scalable and efficient YouTube clone platform.*
