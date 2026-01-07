const cache = new Map();

const CACHE_CONFIG = {
  challenges: 300000, // 5 minutes
  scoreboard: 180000, // 3 minutes
  userProfile: 600000, // 10 minutes
  default: 60000 // 1 minute
};

const MAX_CACHE_SIZE = 1000; // Prevent memory leaks with 500 concurrent users

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
  }

  set(key, value, ttl = CACHE_CONFIG.default) {
    // Implement LRU: If cache full, delete oldest entry
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
    this.stats.sets++;

    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  clear(pattern) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + '%' : 'N/A',
      size: this.cache.size
    };
  }
}

const cacheManager = new CacheManager();

const cachingMiddleware = (ttl = CACHE_CONFIG.default) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.method}:${req.originalUrl}`;
    const cachedResponse = cacheManager.get(cacheKey);

    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    res.setHeader('X-Cache', 'MISS');

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cacheManager.set(cacheKey, data, ttl);
      return originalJson(data);
    };

    next();
  };
};

const invalidateCache = (pattern) => {
  return (req, res, next) => {
    cacheManager.clear(pattern);
    next();
  };
};

const getCacheStats = (req, res) => {
  res.json({
    success: true,
    stats: cacheManager.getStats()
  });
};

module.exports = {
  cachingMiddleware,
  invalidateCache,
  cacheManager,
  getCacheStats,
  CACHE_CONFIG
};
