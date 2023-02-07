import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { MongoClient } from "mongodb";
import userRouter from "./routes/users.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Database(MongoDB) connection
const MONGO_URL = process.env.MONGO_URL;
const client = new MongoClient(MONGO_URL);
await client.connect();
console.log("MongoDB is connected!");

// For cors
app.use(cors());
app.use(morgan("dev"));

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Test middleware
app.use((req, res, next) => {
  // console.log(req.cookies);
  next();
});

app.get("/", (req, res) => {
  res.send("Welcome to your page! 😃");
});

// User route
app.use("/users", userRouter);

app.listen(PORT, () =>
  console.log(`The server is connected to port: ${PORT} ✨✨`)
);

export { client };
