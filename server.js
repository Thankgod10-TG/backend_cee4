const express = require("express");
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();

const PORT = process.env.PORT;

connectDB();
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credetials: true
    })
)

app.use(express.json());

app.use("/api/auth", authRoutes)

app.get('/', (req, res) => {
    res.json({
        message: "Cee 4 collection api is running",
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Client URL: ${process.env.CLIENT_URL}`)
});

