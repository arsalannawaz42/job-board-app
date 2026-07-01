// ---------- Shared state ----------
let allJobs = []; // saari jobs yahan store hoti hain (public homepage ke liye)

// Ek job card ka HTML banata hai
function jobCardHTML(job) {
  return `
    <div class="job-card">
      <div class="top">
        <div>
          <div class="job-title">${job.title}</div>
          <div class="company">${job.company}</div>
        </div>
      </div>
      <div class="meta">${job.location || ""} • Posted: ${job.posted}</div>
      <p class="desc">${job.description || ""}</p>
      ${job.lastDate ? `<div class="last-date">Last Date to Apply: ${job.lastDate}</div>` : ""}
      <br>
      <a class="apply-btn" href="${job.applyLink}" target="_blank" rel="noopener noreferrer">Apply Now</a>
    </div>
  `;
}

// ---------- Public homepage ----------
async function loadPublicJobs() {
  const listEl = document.getElementById("jobList");
  if (!listEl) return;

  try {
    const res = await fetch("/api/jobs");
    allJobs = await res.json();

    populateCityFilter(allJobs);
    renderFilteredJobs();
  } catch (err) {
    listEl.innerHTML = `<p>Jobs load nahi ho sakin. Server check karein.</p>`;
  }
}

// City filter dropdown ko available cities se bharta hai (jitni cities mein jobs hain)
function populateCityFilter(jobs) {
  const cityFilter = document.getElementById("cityFilter");
  if (!cityFilter) return;

  const cities = [...new Set(jobs.map((j) => j.location).filter(Boolean))].sort();

  cityFilter.innerHTML =
    `<option value="">Tamam Shehar</option>` +
    cities.map((c) => `<option value="${c}">${c}</option>`).join("");
}

// Search text aur city filter dono ko combine karke jobs dikhata hai
function renderFilteredJobs() {
  const listEl = document.getElementById("jobList");
  if (!listEl) return;

  const searchInput = document.getElementById("searchInput");
  const cityFilter = document.getElementById("cityFilter");

  const keyword = (searchInput?.value || "").trim().toLowerCase();
  const city = cityFilter?.value || "";

  if (allJobs.length === 0) {
    listEl.innerHTML = `<p style="text-align:center; color:#6B665C;">Filhaal koi job available nahi hai.</p>`;
    return;
  }

  const filtered = allJobs.filter((job) => {
    const matchesKeyword =
      !keyword ||
      job.title.toLowerCase().includes(keyword) ||
      job.company.toLowerCase().includes(keyword) ||
      (job.description || "").toLowerCase().includes(keyword);

    const matchesCity = !city || job.location === city;

    return
