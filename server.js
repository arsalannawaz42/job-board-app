// server.js
// Simple job board backend.
// Public: anyone can view jobs (GET /api/jobs)
// Admin: adding/deleting jobs requires the admin password (set below)

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const JOBS_FILE = path.join(__dirname, "data", "jobs.json");

// 🔐 CHANGE THIS PASSWORD before putting the site online
const ADMIN_PASSWORD = "myjobs123";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readJobs() {
  return JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
}
function writeJobs(jobs) {
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

// Middleware to protect admin routes
function checkAdmin(req, res, next) {
  const password = req.headers["x-admin-password"];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Wrong password" });
  }
  next();
}

// ---------- PUBLIC ----------

// Get all jobs (newest first)
app.get("/api/jobs", (req, res) => {
  const jobs = readJobs().sort((a, b) => new Date(b.posted) - new Date(a.posted));
  res.json(jobs);
});

// ---------- ADMIN ----------

// Add a new job
app.post("/api/jobs", checkAdmin, (req, res) => {
  const jobs = readJobs();
  const { title, company, location, lastDate, description, applyLink } = req.body;

  if (!title || !company || !applyLink) {
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
    posted: new Date().toISOString().split("T")[0],
  };

  jobs.push(newJob);
  writeJobs(jobs);
  res.status(201).json(newJob);
});

// Delete a job
app.delete("/api/jobs/:id", checkAdmin, (req, res) => {
  let jobs = readJobs();
  const id = parseInt(req.params.id);
  const exists = jobs.some((j) => j.id === id);
  if (!exists) return res.status(404).json({ error: "Job nahi mili" });

  jobs = jobs.filter((j) => j.id !== id);
  writeJobs(jobs);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Job board running at http://localhost:${PORT}`);
});
