class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly limit: number;
  private readonly interval: number;

  constructor(limit: number = 5, interval: number = 5000) {
    this.limit = limit;
    this.interval = interval;
  }

  async isAllowed(identifier: string): Promise<boolean> {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // 만료된 요청 제거
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.interval
    );
    
    if (validRequests.length >= this.limit) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
}

export const rateLimiter = new RateLimiter();
