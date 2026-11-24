"use strict";

const path = require("path");
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const convertHeic = require("heic-convert");

// ---- Settings (from config_options.yml -> .env -> environment) ----
const PORT = Number(process.env.PORT) || 8080;
const MAX_UPLOAD_MB = clamp(Number(process.env.MAX_UPLOAD_MB) || 25, 1, 200);
const DEFAULT_FORMAT = pick(process.env.DEFAULT_FORMAT, ["webp", "jpeg", "png", "avif"], "webp");
const DEFAULT_QUALITY = clamp(Number(process.env.DEFAULT_QUALITY) || 80, 1, 100);

const OUTPUT_FORMATS = {
  jpeg: { ext: "jpg", mime: "image/jpeg" },
  png: { ext: "png", mime: "image/png" },
  webp: { ext: "webp", mime: "image/webp" },
  avif: { ext: "avif", mime: "image/avif" },
};

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

const app = express();
app.disable("x-powered-by");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
});

// Settings exposed to the UI (no secrets).
app.get("/api/config", (_req, res) => {
  res.json({
    maxUploadMb: MAX_UPLOAD_MB,
    defaultFormat: DEFAULT_FORMAT,
    defaultQuality: DEFAULT_QUALITY,
    formats: Object.keys(OUTPUT_FORMATS),
  });
});

app.get("/healthz", (_req, res) => res.type("text").send("ok"));

function isHeic(file) {
  const name = (file.originalname || "").toLowerCase();
  return (
    /\.(heic|heif)$/.test(name) ||
    file.mimetype === "image/heic" ||
    file.mimetype === "image/heif"
  );
}

app.post("/api/convert", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Missing image." });

    const format = pick(req.body.format, Object.keys(OUTPUT_FORMATS), DEFAULT_FORMAT);
    const quality = clamp(Number(req.body.quality) || DEFAULT_QUALITY, 1, 100);
    const width = toDim(req.body.width);
    const height = toDim(req.body.height);
    const keepMetadata = req.body.keepMetadata === "true";

    // iPhone photos (HEIC) are not decoded by sharp out of the box: convert to JPEG first.
    let input = req.file.buffer;
    if (isHeic(req.file)) {
      input = Buffer.from(
        await convertHeic({ buffer: input, format: "JPEG", quality: 1 })
      );
    }

    // rotate() with no arguments applies EXIF orientation before metadata is stripped.
    let img = sharp(input, { failOn: "none" }).rotate();
    if (width || height) {
      img = img.resize({ width, height, fit: "inside", withoutEnlargement: true });
    }
    if (keepMetadata) img = img.keepMetadata();

    const opts = { quality };
    if (format === "png") {
      // PNG has no "quality" setting; use maximum lossless compression.
      img = img.png({ compressionLevel: 9 });
    } else {
      img = img.toFormat(format, opts);
    }

    const { data, info } = await img.toBuffer({ resolveWithObject: true });
    const base = (req.file.originalname || "imagen").replace(/\.[^.]+$/, "");
    const outName = `${base}.${OUTPUT_FORMATS[format].ext}`;

    res.set({
      "Content-Type": OUTPUT_FORMATS[format].mime,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(outName)}`,
      "X-Original-Bytes": String(req.file.size),
      "X-Output-Bytes": String(data.length),
      "X-Output-Width": String(info.width),
      "X-Output-Height": String(info.height),
      "Access-Control-Expose-Headers":
        "X-Original-Bytes, X-Output-Bytes, X-Output-Width, X-Output-Height, Content-Disposition",
      "Cache-Control": "no-store",
    });
    res.send(data);
  } catch (err) {
    console.error("convert error:", err && err.message);
    res.status(422).json({ error: "Could not process that image. Is it a valid image file?" });
  }
});

function toDim(v) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 && n <= 20000 ? n : undefined;
}

// Multer errors (e.g. file too large).
app.use((err, _req, res, _next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: `The image exceeds the ${MAX_UPLOAD_MB} MB limit.` });
  }
  console.error(err);
  res.status(500).json({ error: "Internal error." });
});

app.use(express.static(path.join(__dirname, "public"), { maxAge: 0 }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Pi-Tools listening on port ${PORT}`);
});
