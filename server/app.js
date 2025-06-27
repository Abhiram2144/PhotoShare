require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
app.use(express.json());
// const cookieParser = require("cookie-parser");

// app.use(cookieParser());

// const {register,
//   login,
//   getUserById} = require('./controllers/user')

// app.post('/api/auth/signup', register)
// app.post('/api/auth/login', login)
// app.get('/api/auth/:id', getUserById)

const authrouter = require('./routes/user')
app.use('/api/auth', authrouter)

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Server and DB
app.listen(8000, () => {
  console.log("Server running on port 8000");
//   console.log("username and password: ", process.env.DB_USER, process.env.DB_PASSWORD);
  
  mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ucc4fkx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
    .then(() => console.log("Connected to database!"))
    .catch((err) => console.error("MongoDB connection error:", err));
});


// Root Route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

