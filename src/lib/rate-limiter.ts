import { createClient } from "redis";

const redisClient = createClient({
  database: 5,
  password: process.env.REDIS_PASSWORD || undefined,
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10)
  }
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

// 연결 상태 체크 후 연결 (이미 연결되어 있지 않다면)
if (!redisClient.isOpen) {
  redisClient.connect().catch(err => console.error("Redis connection failed:", err));
}

class RateLimiter {
  private readonly limit: number;
  private readonly interval: number; // milliseconds

  constructor(limit: number = 5, interval: number = 5000) {
    this.limit = limit;
    this.interval = interval;
  }

  async isAllowed(identifier: string): Promise<boolean> {
    const key = `rate:${identifier}`;
    try {
      const current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, Math.ceil(this.interval / 1000));
      }
      return current <= this.limit;
    } catch (error) {
      console.error("Rate limiter redis error:", error);
      // 오류 발생 시 안전하게 제한 적용
      return false;
    }
  }
}

export const rateLimiter = new RateLimiter();
