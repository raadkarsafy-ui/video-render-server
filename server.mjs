import express from "express";
import multer from "multer";
import cors from "cors";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json());

// ==============================
// upload config
// ==============================
const upload = multer({
  dest: "uploads/",
});

// ==============================
// test route
// ==============================
app.get("/", (req, res) => {
  res.send("🔥 Video render server running");
});

// ==============================
// upload + render
// ==============================
app.post(
  "/upload",
  upload.single("video"),
  async (req, res) => {
    try {
      const inputPath = req.file.path;
      const outputPath =
        "processed/" + Date.now() + ".mp4";

      ffmpeg(inputPath)
        .outputOptions([
          "-preset veryfast",
          "-movflags faststart",
          "-profile:v baseline",
          "-level 3.0",
          "-vf scale=720:1280",
        ])
        .on("end", () => {
          fs.unlinkSync(inputPath);

          res.json({
            ok: true,
            file: outputPath,
          });
        })
        .on("error", (err) => {
          console.error(err);
          res.status(500).json({
            ok: false,
            error: "ffmpeg failed",
          });
        })
        .save(outputPath);
    } catch (e) {
      console.error(e);
      res.status(500).json({ ok: false });
    }
  }
);

// ==============================
// START SERVER  🔥
// ==============================
app.listen(PORT, () => {
  console.log("🔥 SERVER STARTED");
  console.log(`🚀 http://localhost:${PORT}`);
});
