// ---------- Shared state ----------
let allJobs = []; // holds all jobs for the public homepage

// Master list of Pakistani cities. Used for BOTH:
//   1) the "City" dropdown when posting a job (admin.html)
//   2) the city search box on the homepage (index.html)
// Using ONE shared list keeps them always in sync — whatever city an
// admin picks while posting is guaranteed to already exist in the
// public filter, so there's no mismatch between the two.
const PAKISTAN_CITIES = [
  // Islamabad Capital Territory
  "Islamabad",
  // Punjab
  "Lahore", "Faisalabad", "Rawalpindi", "Multan", "Gujranwala", "Sialkot",
  "Bahawalpur", "Sargodha", "Sahiwal", "Sheikhupura", "Jhang", "Rahim Yar Khan",
  "Kasur", "Okara", "Gujrat", "Mandi Bahauddin", "Wazirabad", "Chiniot",
  "Kot Addu", "Vehari", "Dera Ghazi Khan", "Muzaffargarh", "Khanewal",
  "Hafizabad", "Toba Tek Singh", "Jhelum", "Attock", "Chakwal", "Mianwali",
  "Bhakkar", "Layyah", "Pakpattan", "Kamalia", "Kamoke", "Wah Cantt",
  "Taxila", "Nankana Sahib", "Narowal", "Khushab", "Arifwala", "Burewala",
  "Chishtian", "Daska", "Depalpur", "Haroonabad", "Jaranwala", "Kabirwala",
  "Lodhran", "Mailsi", "Pattoki", "Samundri", "Shakargarh", "Shorkot",
  // Sindh
  "Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah", "Mirpur Khas",
  "Jacobabad", "Shikarpur", "Khairpur", "Dadu", "Thatta", "Badin",
  "Tando Adam", "Tando Allahyar", "Umerkot", "Ghotki", "Kandhkot",
  "Kashmore", "Matiari", "Naushahro Feroze", "Sanghar", "Kotri",
  // Khyber Pakhtunkhwa
  "Peshawar", "Mardan", "Abbottabad", "Mingora (Swat)", "Kohat", "Bannu",
  "Dera Ismail Khan", "Nowshera", "Charsadda", "Swabi", "Haripur",
  "Mansehra", "Chitral", "Batkhela", "Timergara", "Tank", "Hangu",
  "Karak", "Lakki Marwat", "Buner",
  // Balochistan
  "Quetta", "Gwadar", "Turbat", "Khuzdar", "Sibi", "Chaman", "Zhob",
  "Loralai", "Dera Murad Jamali", "Hub", "Panjgur", "Mastung", "Kalat",
  "Nushki",
  // Azad Kashmir
  "Muzaffarabad", "Mirpur (AJK)", "Rawalakot", "Kotli", "Bagh",
  // Gilgit-Baltistan
  "Gilgit", "Skardu", "Hunza", "Ghanche",
  // Remote
  "Remote / Work from Home",
].sort((a, b) => a.localeCompare(b));

// Builds the HTML for a single job card
function jobCardHTML(job) {
  const postedLabel = formatDate(job.posted);
  return `
    <div class="job-card">
      ${
        job.image
          ? `<div class="job-image-wrap" onclick="openImageModal('${job.image}')">
               <img class="job-image" src="${job.image}" alt="${job.title} advertisement">
             </div>`
          : ""
      }
      <div class="top">
        <div>
          <div class="job-title">${job.title}</div>
          <div class="company">${job.company}</div>
        </div>
      </div>
      <div class="meta">${job.location || ""} • Posted: ${postedLabel}</div>
      <p class="desc">${job.description || ""}</p>
      ${job.lastDate ? `<div class="last-date">Last Date to Apply: ${job.lastDate}</div>` : ""}
      <br>
      <a class="apply-btn" href="${job.applyLink}" target="_blank" rel="noopener noreferrer">Apply Now</a>
    </div>
  `;
}

// Turns an ISO date string like "2026-06-30T10:15:00.000Z" into a readable date
function formatDate(isoString) {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString || "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ---------- Image lightbox (click a job image to view it full-size) ----------
function openImageModal(src) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("imageModalImg");
  if (!modal || !modalImg) return;
  modalImg.src = src;
  modal.classList.add("active");
}

function closeImageModal() {
  const modal = document.getElementById("imageModal");
  if (modal) modal.classList.remove("active");
}

// ---------- Public homepage ----------
async function loadPublicJobs() {
  const listEl = document.getElementById("jobList");
  if (!listEl) return;

  try {
    const res = await fetch("/api/jobs");
    allJobs = await res.json();

    // Jobs are always sorted newest-first by their POSTED time.
    // The "Last Date to Apply" field never affects this sort — whether or
    // not a job has a last date, it keeps its rightful posting-time position.
    allJobs.sort((a, b) => new Date(b.posted) - new Date(a.posted));

    populateCityFilter();
    renderFilteredJobs();
  } catch (err) {
    listEl.innerHTML = `<p>Could not load jobs. Please check the server.</p>`;
  }
}

// Fills the city search box's suggestion list with the FULL Pakistan city list
// (previously it only listed cities that already had a job posted, so it looked
// very short). Now the full list is always available, whether or not a city
// currently has any jobs.
function populateCityFilter() {
  const dataList = document.getElementById("cityListOptions");
  if (!dataList) return;

  // if a job's city isn't in the master list (a custom typed city),
  // include it too so it can still be searched/filtered
  const extraCities = allJobs
    .map((j) => j.location)
    .filter((loc) => loc && !PAKISTAN_CITIES.includes(loc));

  const allCities = [...new Set([...PAKISTAN_CITIES, ...extraCities])].sort((a, b) =>
    a.localeCompare(b)
  );

  dataList.innerHTML = allCities.map((c) => `<option value="${c}"></option>`).join("");
}

// Combines the keyword search and city filter to render matching jobs
function renderFilteredJobs() {
  const listEl = document.getElementById("jobList");
  if (!listEl) return;

  const searchInput = document.getElementById("searchInput");
  const cityFilter = document.getElementById("cityFilter");

  const keyword = (searchInput?.value || "").trim().toLowerCase();
  const city = (cityFilter?.value || "").trim().toLowerCase();

  if (allJobs.length === 0) {
    listEl.innerHTML = `<p style="text-align:center; color:#6B665C;">No jobs available right now.</p>`;
    return;
  }

  const filtered = allJobs.filter((job) => {
    const matchesKeyword =
      !keyword ||
      job.title.toLowerCase().includes(keyword) ||
      job.company.toLowerCase().includes(keyword) ||
      (job.description || "").toLowerCase().includes(keyword);

    const matchesCity = !city || (job.location || "").toLowerCase().includes(city);

    return matchesKeyword && matchesCity;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `<p style="text-align:center; color:#6B665C;">No jobs found for this search/city.</p>`;
    return;
  }

  listEl.innerHTML = filtered.map(jobCardHTML).join("");
}

function setupFilters() {
  const searchInput = document.getElementById("searchInput");
  const cityFilter = document.getElementById("cityFilter");

  searchInput?.addEventListener("input", renderFilteredJobs);
  cityFilter?.addEventListener("input", renderFilteredJobs);
}

// ---------- Admin page ----------
function getAdminPassword() {
  return document.getElementById("adminPassword")?.value || "";
}

// Fills the admin's "City" dropdown from the same master Pakistan city list,
// with "Other" added at the end for manual entry.
function populateAdminCityDropdown() {
  const citySelect = document.getElementById("location");
  if (!citySelect) return;

  const options = PAKISTAN_CITIES.map((c) => `<option value="${c}">${c}</option>`).join("");

  citySelect.innerHTML =
    `<option value="">-- Select City --</option>` +
    options +
    `<option value="Other">Other (type manually)</option>`;
}

async function loadAdminJobs() {
  const el = document.getElementById("adminJobList");
  if (!el) return;

  const res = await fetch("/api/jobs");
  const jobs = await res.json();

  if (jobs.length === 0) {
    el.innerHTML = "<p>No jobs yet.</p>";
    return;
  }

  el.innerHTML = jobs
    .map(
      (job) => `
    <div class="admin-job-row">
      <span>${job.image ? "🖼️ " : ""}${job.title} — ${job.company} ${job.location ? `(${job.location})` : ""}</span>
      <button class="del-btn" onclick="deleteJob(${job.id})">Delete</button>
    </div>
  `
    )
    .join("");
}

async function deleteJob(id) {
  const password = getAdminPassword();
  if (!password) {
    alert("Please enter the admin password first.");
    return;
  }
  if (!confirm("Are you sure you want to delete this job?")) return;

  const res = await fetch(`/api/jobs/${id}`, {
    method: "DELETE",
    headers: { "x-admin-password": password },
  });

  if (res.status === 401) {
    alert("Incorrect password.");
    return;
  }
  loadAdminJobs();
}

// Shows the manual text field when "Other" is selected in the City dropdown
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

// Shows the selected file's name as a small preview label
function setupImagePreview() {
  const imageInput = document.getElementById("jobImage");
  const previewEl = document.getElementById("imagePreviewName");
  if (!imageInput) return;

  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!previewEl) return;
    previewEl.textContent = file ? `Selected: ${file.name}` : "";
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
      msgEl.textContent = "Please enter the admin password first.";
      return;
    }

    const citySelect = document.getElementById("location");
    const otherCityInput = document.getElementById("otherCity");
    const finalCity =
      citySelect.value === "Other" ? otherCityInput.value.trim() : citySelect.value;

    // FormData is used so the job advertisement image can be sent too
    // (multipart/form-data), not just JSON text.
    const formData = new FormData();
    formData.append("title", document.getElementById("title").value);
    formData.append("company", document.getElementById("company").value);
    formData.append("location", finalCity);
    formData.append("lastDate", document.getElementById("lastDate").value);
    formData.append("description", document.getElementById("description").value);
    formData.append("applyLink", document.getElementById("applyLink").value);

    const imageInput = document.getElementById("jobImage");
    if (imageInput && imageInput.files[0]) {
      formData.append("image", imageInput.files[0]);
    }

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "x-admin-password": password,
          // Content-Type is NOT set manually — the browser sets the
          // correct multipart boundary automatically for FormData.
        },
        body: formData,
      });

      if (res.status === 401) {
        msgEl.style.color = "#c0392b";
        msgEl.textContent = "Incorrect password.";
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "failed");
      }

      msgEl.style.color = "#2F7A6F";
      msgEl.textContent = "Job added successfully!";
      form.reset();
      document.getElementById("otherCityWrap").style.display = "none";
      const previewEl = document.getElementById("imagePreviewName");
      if (previewEl) previewEl.textContent = "";
      loadAdminJobs();
    } catch (err) {
      msgEl.style.color = "#c0392b";
      msgEl.textContent = err.message || "Something went wrong, please try again.";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadPublicJobs();
  setupFilters();
  populateAdminCityDropdown();
  loadAdminJobs();
  setupAdminForm();
  setupCityDropdown();
  setupImagePreview();
});
