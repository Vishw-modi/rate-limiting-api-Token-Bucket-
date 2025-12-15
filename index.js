import express from "express";
import { rateLimiter } from "./rate-limiter.js";

const app = express();
app.use(express.json());
let count = 0;

app.get("/", rateLimiter, (req, res) => {
  console.log(count++);

  res.send("Hello, World!");
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
