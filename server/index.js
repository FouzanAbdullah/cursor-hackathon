import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import scanRouter from "./routes/scan.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/api/scan", scanRouter);

app.listen(PORT, () => {
  console.log(`Expecta running on http://localhost:${PORT}`);
});
