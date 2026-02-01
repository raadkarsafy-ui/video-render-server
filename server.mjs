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
// static access
// ==============================
app.use("/videos", express.static(processedDir));

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
// upload + render
// ==============================
app.post(
  "/upload",
  upload.single("video"),
  async (req, res) => {
    try {
      const inputPath = req.file.path;

      const fileName = Date.now() + ".mp4";
      const outputPath = path.join(processedDir, fileName);

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
          // remove uploaded raw file
          fs.unlinkSync(inputPath);

          // send result to app
          res.json({
            ok: true,
            url: `/videos/${fileName}`,
            fullUrl: `${req.protocol}://${req.get(
              "host"
            )}/videos/${fileName}`,
          });

          // 🔥 auto delete after 60 seconds
          setTimeout(() => {
            fs.unlink(outputPath, () => {});
          }, 60000);
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
// START SERVER 🔥
// ==============================
app.listen(PORT, () => {
  console.log("🔥 SERVER STARTED");
  console.log(`🚀 PORT ${PORT}`);
});
