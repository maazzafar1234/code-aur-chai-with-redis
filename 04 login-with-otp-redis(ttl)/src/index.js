import express from "express";
import Redis from 'ioredis';

const app = express();
app.use(express.json());  

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

function otpKey(phone) {
  return `otp:${phone}`;
}

app.post("/otp", async (req, res) => {
  const phone = req.body.phone;
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP

  await redis.set(otpKey(phone), otp, 'EX', 30); // Store OTP with a TTL of 30 seconds
  res.json({ success: true, otp }); // In a real application, you would send the OTP via SMS instead of returning it in the response
});


app.post("/otp/verify", async (req, res) => {
  const {phone, otp} = req.body;
  const storedOtp = await redis.get(otpKey(phone));

  if (!storedOtp) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }
  if (storedOtp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }
  await redis.del(otpKey(phone)); // Delete the OTP after successful verification
  res.json({ success: true, message: "OTP verified successfully" });
});

app.get("/otp/:phone/ttl", async (req, res) => {
  const ttl = await redis.ttl(otpKey(req.params.phone));
  res.json({ ttl });
});


app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
