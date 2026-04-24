const express = require("express");
const cors = require("cors");
const { processData } = require("./processor");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/bfhl", (req, res) => {
  res.status(200).json({ operation_code: 1 });
});

app.post("/bfhl", (req, res) => {
  const { data } = req.body;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: "Invalid request: 'data' must be an array." });
  }

  try {
    const result = processData(data);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Processing error:", err);
    return res.status(500).json({ error: "Internal server error during processing." });
  }
});

app.listen(PORT, () => {
  console.log(`BFHL server running on http://localhost:${PORT}`);
});
