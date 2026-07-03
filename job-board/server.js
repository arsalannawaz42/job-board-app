// server.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = path.join(__dirname, "public", "uploads");

// 🔐 CHANGE THIS PASSWORD before putting the site online
const ADMIN_PASSWORD = "myjobs123";

// ---------- MongoDB Connection ----------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ---------- Job Schema ----------
const jobSchema = new mongoose.Schema({
  id: Number,
  title: String,
  company: String,
  location: String,
  lastDate: String,
  description: String,
  applyLink: String,
  image: String,
  posted: String,
});

const Job = mongoose.model("Job", jobSchema);

// Make sure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ---------- Image upload config (multer) ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const okExt = allowed.test(path.extname(file.originalname).toLowerCase());
    const okMime = allowed.test(file.mimetype);
    if (okExt && okMime) return cb(null, true);
    cb(new Error("Only image files (jpg, png, webp, gif) are allowed"));
  },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function sortByPostedDesc(jobs) {
  return jobs.slice().sort((a, b) => {
    const timeA = new Date(a.posted).getTime();
    const timeB = new Date(b.posted).getTime();
    const safeA = Number.isFinite(timeA) ? timeA : 0;
    const safeB = Number.isFinite(timeB) ? timeB : 0;
    if (safeB !== safeA) return safeB - safeA;
    return (b.id || 0) - (a.id || 0);
  });
}

function checkAdmin(req, res, next) {
  const password = req.headers["x-admin-password"] || req.body.adminPassword;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Wrong password" });
  }
  next();
}

// ---------- PUBLIC ----------
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find({});
    res.json(sortByPostedDesc(jobs));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// ---------- ADMIN ----------
app.post("/api/jobs", upload.single("image"), checkAdmin, async (req, res) => {
  try {
    const { title, company, location, lastDate, description, applyLink } = req.body;

    if (!title || !company || !applyLink) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: "Title, company, and apply link are required" });
    }

    const lastJob = await Job.findOne().sort({ id: -1 });
    const newId = lastJob ? lastJob.id + 1 : 1;

    const newJob = new Job({
      id: newId,
      title,
      company,
      location: location || "",
      lastDate: lastDate || "",
      description: description || "",
      applyLink,
      image: req.file ? `/uploads/${req.file.filename}` : "",
      posted: new Date().toISOString(),
    });

    await newJob.save();
    res.status(201).json(newJob);
  } catch (err) {
    res.status(500).json({ error: "Failed to add job" });
  }
});

app.delete("/api/jobs/:id", checkAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const job = await Job.findOne({ id });
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (job.image) {
      const imgPath = path.join(__dirname, "public", job.image);
      fs.unlink(imgPath, () => {});
    }

    await Job.deleteOne({ id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete job" });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ error: err.message || "Something went wrong with the upload" });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Job board running at http://localhost:${PORT}`);
});
