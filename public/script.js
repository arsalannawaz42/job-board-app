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

    return matchesKeyword && matchesCity;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `<p style="text-align:center; color:#6B665C;">Is search/shehar ke liye koi job nahi mili.</p>`;
    return;
  }

  listEl.innerHTML = filtered.map(jobCardHTML).join("");
}

function setupFilters() {
  const searchInput = document.getElementById("searchInput");
  const cityFilter = document.getElementById("cityFilter");

  searchInput?.addEventListener("input", renderFilteredJobs);
  cityFilter?.addEventListener("change", renderFilteredJobs);
}

// ---------- Admin page ----------
function getAdminPassword() {
  return document.getElementById("adminPassword")?.value || "";
}

async function loadAdminJobs() {
  const el = document.getElementById("adminJobList");
  if (!el) return;

  const res = await fetch("/api/jobs");
  const jobs = await res.json();

  if (jobs.length === 0) {
    el.innerHTML = "<p>Koi job nahi hai.</p>";
    return;
  }

  el.innerHTML = jobs
    .map(
      (job) => `
    <div class="admin-job-row">
      <span>${job.title} — ${job.company} ${job.location ? `(${job.location})` : ""}</span>
      <button class="del-btn" onclick="deleteJob(${job.id})">Delete</button>
    </div>
  `
    )
    .join("");
}

async function deleteJob(id) {
  const password = getAdminPassword();
  if (!password) {
    alert("Pehle admin password likhein.");
    return;
  }
  if (!confirm("Kya aap is job ko delete karna chahte hain?")) return;

  const res = await fetch(`/api/jobs/${id}`, {
    method: "DELETE",
    headers: { "x-admin-password": password },
  });

  if (res.status === 401) {
    alert("Password ghalat hai.");
    return;
  }
  loadAdminJobs();
}

// "City" dropdown mein "Other" select hone par manual text field dikhana
function setupCityDropdown() {
  const citySelect = document.getElementById("location");
  const otherWrap = document.getElementById("otherCityWrap");
  const otherInput = document.getElementById("otherCity");
  if (!citySelect || !otherWrap) return;

  citySelect.addEventListener("change", () => {
    if (citySelect.value === "Other") {
      otherWrap.style.display = "block";
      otherInput.setAttribute("required", "required");
    } else {
      otherWrap.style.display = "none";
      otherInput.removeAttribute("required");
      otherInput.value = "";
    }
  });
}

function setupAdminForm() {
  const form = document.getElementById("jobForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msgEl = document.getElementById("formMsg");
    const password = getAdminPassword();

    if (!password) {
      msgEl.style.color = "#c0392b";
      msgEl.textContent = "Pehle admin password likhein.";
      return;
    }

    const citySelect = document.getElementById("location");
    const otherCityInput = document.getElementById("otherCity");
    const finalCity =
      citySelect.value === "Other" ? otherCityInput.value.trim() : citySelect.value;

    const payload = {
      title: document.getElementById("title").value,
      company: document.getElementById("company").value,
      location: finalCity,
      lastDate: document.getElementById("lastDate").value,
      description: document.getElementById("description").value,
      applyLink: document.getElementById("applyLink").value,
    };

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        msgEl.style.color = "#c0392b";
        msgEl.textContent = "Password ghalat hai.";
        return;
      }
      if (!res.ok) throw new Error("failed");

      msgEl.style.color = "#2F7A6F";
      msgEl.textContent = "Job add ho gayi!";
      form.reset();
      document.getElementById("otherCityWrap").style.display = "none";
      loadAdminJobs();
    } catch (err) {
      msgEl.style.color = "#c0392b";
      msgEl.textContent = "Kuch masla hua, dobara try karein.";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadPublicJobs();
  setupFilters();
  loadAdminJobs();
  setupAdminForm();
  setupCityDropdown();
});
