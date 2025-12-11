import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/router";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://bestdrive.francautolabs.com.br",
      "http://localhost:5173",
      "https://smartsandbox.francautolabs.com.br",
      "https://smartcompras.francautolabs.com.br",
      "https://sandboxsmart.francautolabs.com.br",
      "http://211.2.100.245:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use("/api", router);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/pdfs", express.static(path.join(__dirname, "../pdfs")));

app.listen(PORT, () => {
  console.log(`-> Servidor rodando em http://localhost:${PORT}`);
});
