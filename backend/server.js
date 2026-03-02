const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

require("dotenv").config()

const app = express()
const cors = require("cors");

app.use(
  cors({
    origin: "https://mernstack-todoapp.netlify.app/",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);
app.use(express.json())

// mongoDb connection
mongoose.connect("mongodb://127.0.0.1:27017/todolist")
.then(()=>console.log("MongoDb Connected"))
.catch((err)=>console.log(err));

// Routes
const todoRoutes = require("./routes/todoRoutes");
app.use("/api/todos",todoRoutes);

app.listen(5000,()=>{
    console.log("Server running on port 5000");
})