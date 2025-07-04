require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const authrouter = require('./routes/user')



app.use(express.json());
app.use('/api/auth', authrouter)
app.use("/api/relations", require("./routes/relations"));





app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

app.listen(8000, () => {
  console.log("Server running on port 8000");
  
  mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ucc4fkx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
    .then(() => console.log("Connected to database!"))
    .catch((err) => console.error("MongoDB connection error:", err));
});


// Root Route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

