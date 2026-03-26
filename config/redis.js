const redis = require("redis");
require('dotenv').config()

const client = redis.createClient({
    url: process.env.REDIS_URL
});

client.on('error', (err) => {
    console.log("Redis client error", err);
})

client.on("connect", () => {
    console.log("Redis is connected");
});

client.on("ready", () => {
    console.log("Redis is ready");
});

(async () => {
    try {
        await client.connect();
    } catch(e) {
        console.log("Failed to conect to Redis")
    }
})();

module.exports = client;
