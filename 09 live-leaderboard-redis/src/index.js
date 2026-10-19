import express from "express";
import Redis from "ioredis";

const app = express();
app.use(express.json());

const redis = new Redis();

// Increment post views
app.post("/post/:id/view", async (req, res) => {
  const views = await redis.incr(`post:${req.params.id}:views`);
  res.json({ views });
});

// Add points using a Redis lock
app.post("/leaderboard/score", async (req, res) => {
  const { userId, points } = req.body;
  const lock = await redis.set("leaderboard:lock", "1", "NX", "PX", 5000);

  if (!lock) return res.status(409).json({ message: "Leaderboard is busy" });

  try {
      const score = await redis.zincrby("leaderboard", points, userId);
      res.json({ userId, score });
  } finally {
    await redis.del("leaderboard:lock");
  }
});

// Get top 10 users
app.get("/leaderboard", async (req, res) => {
  const leaders = await redis.zrevrange("leaderboard", 0, 9, "WITHSCORES");
  res.json({ leaders });
});

// Get user's rank
app.get("/leaderboard/:userId/rank", async (req, res) => {
  const rank = await redis.zrevrank("leaderboard", req.params.userId);
  res.json({ rank: rank === null ? null : rank + 1 });
});

app.listen(3000, () => console.log("Server running on port 3000"));
