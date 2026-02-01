import express from "express";
import multer from "multer";
import cors from "cors";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

// ==============================
// folders
// ==============================
const uploadDir = "uploads";
const processedDir = "processed";

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir);

// ==============================
// upload config
// ==============================
const upload = multer({
  dest: uploadDir + "/",
});

// ==============================
// test route
// ==============================
app.get("/", (req, res) => {
  res.send("🔥 Video render server running");
});

// ==============================
// upload + render (bytes response)
// ==============================
app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const inputPath = req.file.path;
    const outputPath = path.join(
      processedDir,
      Date.now() + ".mp4"
    );

    ffmpeg(inputPath)
      .outputOptions([
        "-preset veryfast",
        "-movflags +faststart",
        "-pix_fmt yuv420p",
        "-profile:v baseline",
        "-level 3.0",
        "-vf scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2",
      ])
      .on("end", () => {
        // read video bytes
        const videoBuffer = fs.readFileSync(outputPath);

        // headers
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=video.mp4"
        );

        // send bytes
        res.send(videoBuffer);

        // cleanup
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
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
});

// ==============================
// START SERVER 🔥
// ==============================
app.listen(PORT, () => {
  console.log("🔥 SERVER STARTED");
  console.log(`🚀 PORT ${PORT}`);
});
