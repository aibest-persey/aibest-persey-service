import { Redis } from "@upstash/redis";
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
export default redis;
//# sourceMappingURL=redis-client.js.map