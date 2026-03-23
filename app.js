const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimiter = require("express-rate-limit");
const { errorHandler } = require("./middleware/errorHandling.middleware");
const { responseHandler } = require("./middleware/response.middleware");


const app = express();

require("dotenv").config();

// middleware
app.use(cookieParser());
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:5174', 
        'http://localhost:5175', 
        'https://cred-axis-beryl.vercel.app'
    ], 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json())
app.use(bodyParser.json());

app.use(responseHandler)

app.get('/', (req, res) => {
    res.send("Hello word, welcome to Favour's final year project")
})


app.use(errorHandler);

module.exports = app;