import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import ClothingItem from "./models/ClothingItem.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Use environment variable for MongoDB URI
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI, {
    dbName: "WardrobeDB", // Change this to your database name
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ✅ Routes
app.post("/api/clothing", async (req, res) => {
  try {
    const newItem = new ClothingItem(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: "❌ Error saving item" });
  }
});

app.get("/api/clothing", async (req, res) => {
  try {
    const items = await ClothingItem.find();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "❌ Error fetching items" });
  }
});
