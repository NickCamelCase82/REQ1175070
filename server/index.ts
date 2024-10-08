require("dotenv").config();
const express = require("express");
const cors = require("cors");
const userRouter = require("./routes/userRoutes");

const PORT = process.env.PORT ?? 5000;

const corsConfig = {
  origin: [
    "http://localhost:3001",
    "https://www.bclaws.gov.bc.ca/*",
    "https://NickCamelCase82.github.io/REQ1175070/*",
  ],
  methods: "GET, POST",
  credentials: true,
};

const app = express();
app.use(cors(corsConfig));
app.use(express.json());
app.use("/user", userRouter);

app.listen(PORT, () => console.log(`Server is up and running on port ${PORT}`));
