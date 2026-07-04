import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

export const redis = globalForRedis.redis || new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

// Create a separate connection for BullMQ to avoid type issues
export function createBullMQConnection() {
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}
