require("dotenv").config();
const mongoose = require("mongoose");

const DB_URI = process.env.DB_URI;

const DB = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log("Connected to MongoDB");
    } catch(e) {
        console.error("Error connecting to MongoDB", error);
        process.exit(1);
    }
}

module.exports = DB;