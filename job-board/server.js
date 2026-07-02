// server.js
// Simple job board backend.
// Public: anyone can view jobs (GET /api/jobs)
// Admin: adding/deleting jobs requires the admin password (set below)

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const JOBS_FILE = path.join(__dirname, "data", "jobs.json");
const UPLOADS_DIR = path.join(__dirname, "public", "uploads");

// 🔐 CHANGE THIS PASSWORD before putting the site online
const ADMIN_PASSWORD = "myjobs123";

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
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const okExt = allowed.test(path.extname(file.originalname).toLowerCase());
    const okMime = allowed.test(file.mimetype);
    if (okExt && okMime) return cb(null, true);
    cb(new Error("Sirf image files (jpg, png, webp, gif) allowed hain"));
  },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readJobs() {
  return JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
}
function writeJobs(jobs) {
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

// Sort strictly by when the job was POSTED (newest first).
// This never looks at lastDate — a job with no last date, or an
// expired last date, still stays exactly where its post time puts it.
function sortByPostedDesc(jobs) {
  return jobs.slice().sort((a, b) => {
    const timeA = new Date(a.posted).getTime();
    const timeB = new Date(b.posted).getTime();
    const safeA = Number.isFinite(timeA) ? timeA : 0;
    const safeB = Number.isFinite(timeB) ? timeB : 0;
    if (safeB !== safeA) return safeB - safeA;
    // tie-breaker: higher id = added later = should come first
    return (b.id || 0) - (a.id || 0);
  });
}

// Middleware to protect admin routes
function checkAdmin(req, res, next) {
  const password = req.headers["x-admin-password"] || req.body.adminPassword;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Wrong password" });
  }
  next();
}

// ---------- PUBLIC ----------

// Get all jobs (newest posted first, independent of lastDate)
app.get("/api/jobs", (req, res) => {
  const jobs = sortByPostedDesc(readJobs());
  res.json(jobs);
});

// ---------- ADMIN ----------

// Add a new job (multipart/form-data so an image can be attached)
app.post("/api/jobs", upload.single("image"), checkAdmin, (req, res) => {
  const jobs = readJobs();
  const { title, company, location, lastDate, description, applyLink } = req.body;

  if (!title || !company || !applyLink) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: "title, company aur applyLink zaroori hain" });
  }

  const newJob = {
    id: jobs.length ? Math.max(...jobs.map((j) => j.id)) + 1 : 1,
    title,
    company,
    location: location || "",
    lastDate: lastDate || "",
    description: description || "",
    applyLink,
    image: req.file ? `/uploads/${req.file.filename}` : "",
    posted: new Date().toISOString(), // full timestamp -> exact posting order
  };

  jobs.push(newJob);
  writeJobs(jobs);
  res.status(201).json(newJob);
});

// Delete a job
app.delete("/api/jobs/:id", checkAdmin, (req, res) => {
  let jobs = readJobs();
  const id = parseInt(req.params.id);
  const job = jobs.find((j) => j.id === id);
  if (!job) return res.status(404).json({ error: "Job nahi mili" });

  // remove the job's image file from disk too, if it has one
  if (job.image) {
    const imgPath = path.join(__dirname, "public", job.image);
    fs.unlink(imgPath, () => {});
  }

  jobs = jobs.filter((j) => j.id !== id);
  writeJobs(jobs);
  res.json({ success: true });
});

// Multer errors (bad file type / too large) come through here
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ error: err.message || "Upload mein masla hua" });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Job board running at http://localhost:${PORT}`);
});
