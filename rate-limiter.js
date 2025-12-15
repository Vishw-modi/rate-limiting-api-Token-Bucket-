import { redis } from "./redis.js";

const MAX_TOKEN = 5;
const REFILL_TIME = 10;

export async function rateLimiter(req, res, next) {
  const ip = req.headers["ip"];

  if (!ip) {
    return res.status(401).json("IP address is required");
  }

  const key = `rate_limit:${ip}`;

  const lucScrpipt = `
    local tokens = redis.call("GET", KEYS[1])
    
    if not tokens then
        redis.call("SET", KEYS[1],ARGV[1])
        redis.call("EXPIRE", KEYS[1], ARGV[2])
        return ARGV[1] - 1
    end
    
    tokens = tonumber(tokens)
    if tokens <= 0 then
        return -1
    end

    redis.call("DECR", KEYS[1])
    return tokens - 1
    `;

  const remaining = await redis.eval(
    lucScrpipt,
    1,
    key,
    MAX_TOKEN,
    REFILL_TIME
  );

  if (remaining < 0) {
    return res
      .status(429)
      .json({ message: "Too many requests. Please try again later." });
  }

  res.setHeader("X-RateLimit-Remaining", remaining);
  next();
}
