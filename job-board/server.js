// server.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 CHANGE THIS PASSWORD before putting the site online
const ADMIN_PASSWORD = "myjobs123";

// ---------- MongoDB Connection ----------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ---------- Cloudinary Config ----------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
  imagePublicId: String, // needed so we can delete the image from Cloudinary later
  posted: String,
});

const Job = mongoose.model("Job", jobSchema);

// ---------- Image upload config (multer -> Cloudinary) ----------
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "job-board", // all images will be stored inside this Cloudinary folder
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Serve the job detail page for pretty URLs like /job/5
app.get("/job/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "job.html"));
});

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
      if (req.file && req.file.filename) {
        cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      }
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
      image: req.file ? req.file.path : "", // Cloudinary's hosted URL
      imagePublicId: req.file ? req.file.filename : "", // Cloudinary's public_id, for deletion later
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

    if (job.imagePublicId) {
      cloudinary.uploader.destroy(job.imagePublicId).catch(() => {});
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
