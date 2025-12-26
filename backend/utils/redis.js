const Redis = require('ioredis');

// Singleton Redis client to prevent connection exhaustion
// Critical for 500+ concurrent users - only ONE connection pool
let redisClient = null;
let redisSubscriber = null;

/**
 * Get or create the main Redis client (for caching, rate limiting, sessions)
 * Reuses connection across all modules to prevent memory leak
 */
function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
      // Connection pool settings for high load
      maxPoolSize: 50, // Limit connections per client
      minPoolSize: 10
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✓ Redis Client Connected');
    });

    redisClient.on('ready', () => {
      console.log('✓ Redis Client Ready');
    });
  }

  return redisClient;
}

/**
 * Get or create the Redis subscriber client (for pub/sub)
 * Separate client required by Redis protocol - cannot reuse main client
 */
function getRedisSubscriber() {
  if (!redisSubscriber) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisSubscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false
    });

    redisSubscriber.on('error', (err) => {
      console.error('Redis Subscriber Error:', err);
    });

    redisSubscriber.on('connect', () => {
      console.log('✓ Redis Subscriber Connected');
    });
  }

  return redisSubscriber;
}

/**
 * Graceful shutdown - close all connections
 */
async function closeRedis() {
  const promises = [];
  
  if (redisClient) {
    promises.push(redisClient.quit());
    redisClient = null;
  }
  
  if (redisSubscriber) {
    promises.push(redisSubscriber.quit());
    redisSubscriber = null;
  }

  await Promise.all(promises);
  console.log('✓ Redis connections closed');
}

module.exports = {
  getRedisClient,
  getRedisSubscriber,
  closeRedis
};
