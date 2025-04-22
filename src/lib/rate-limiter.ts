import { Redis } from "@upstash/redis";

// Upstash Redis 연결 (환경 변수 UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN 필요)
const redis = new Redis({
	url: process.env.UPSTASH_REDIS_URL!,
	token: process.env.UPSTASH_REDIS_TOKEN!
});

// Redis 기반 레이트 리미터 구현: 지정 시간 내에 허용된 최대 요청 수를 초과하면 false 반환
class RateLimiter {
  private readonly limit: number;
  private readonly interval: number; // milliseconds

  constructor(limit: number = 5, interval: number = 5000) {
    this.limit = limit;
    this.interval = interval;
  }

  async isAllowed(identifier: string): Promise<boolean> {
    const key = `rate:${identifier}`;
    // INCR 명령어로 요청 수 증가. 최초 요청 시 1 반환
    const current = await redis.incr(key);
    if (current === 1) {
      // 최초 요청에 대해 TTL 설정 (초 단위)
      await redis.expire(key, Math.ceil(this.interval / 1000));
    }
    return current <= this.limit;
  }
}

export const rateLimiter = new RateLimiter();
