require("dotenv").config();
const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT ?? 5000;

const corsConfig = {
  origin: "http://localhost:3001",
  methods: "GET",
  credentials: true,
};

const app = express();
app.use(cors(corsConfig));
app.use(express.json());

app.listen(PORT, () => console.log(`Server is up and running on port ${PORT}`));
