// ---------- Shared state ----------
let allJobs = []; // saari jobs yahan store hoti hain (public homepage ke liye)

// Master list of Pakistani cities. Used for BOTH:
//   1) the "City" dropdown when posting a job (admin.html)
//   2) the city search/filter dropdown on the homepage (index.html)
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

// Ek job card ka HTML banata hai
function jobCardHTML(job) {
  const postedLabel = formatDate(job.posted);
  return `
    <div class="job-card">
      ${job.image ? `<img class="job-image" src="${job.image}" alt="${job.title} advertisement">` : ""}
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

// "2026-06-30T10:15:00.000Z" jaisi ISO string ko readable date mein badalta hai
function formatDate(isoString) {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString || "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ---------- Public homepage ----------
async function loadPublicJobs() {
  const listEl = document.getElementById("jobList");
  if (!listEl) return;

  try {
    const res = await fetch("/api/jobs");
    allJobs = await res.json();

    // Jobs hamesha "posted" time ke hisaab se newest-first hoti hain.
    // "lastDate" (apply deadline) ka is sort se koi lena dena nahi —
    // job ki lastDate ho ya na ho, wo apni posting-time position par hi rehti hai.
    allJobs.sort((a, b) => new Date(b.posted) - new Date(a.posted));

    populateCityFilter();
    renderFilteredJobs();
  } catch (err) {
    listEl.innerHTML = `<p>Jobs load nahi ho sakin. Server check karein.</p>`;
  }
}

// City search box ke "datalist" ko HAMESHA Pakistan ki poori city list se bharta hai
// (pehle ye sirf un cities se bharta tha jin mein koi job maujood ho — is
// wajah se list bohot chhoti dikhti thi. Ab poori list hamesha available hai,
// chahe kisi city mein job ho ya na ho.) User ab type karke city search kar sakta hai,
// bade dropdown mein scroll nahi karna padta.
function populateCityFilter() {
  const dataList = document.getElementById("cityListOptions");
  if (!dataList) return;

  // agar kisi job ki city master list mein na ho (custom typed city),
  // usay bhi list mein shamil kar dete hain taake wo filter ho sake
  const extraCities = allJobs
    .map((j) => j.location)
    .filter((loc) => loc && !PAKISTAN_CITIES.includes(loc));

  const allCities = [...new Set([...PAKISTAN_CITIES, ...extraCities])].sort((a, b) =>
    a.localeCompare(b)
  );

  dataList.innerHTML = allCities.map((c) => `<option value="${c}"></option>`).join("");
}

// Search text aur city filter dono ko combine karke jobs dikhata hai
function renderFilteredJobs() {
  const listEl = document.getElementById("jobList");
  if (!listEl) return;

  const searchInput = document.getElementById("searchInput");
  const cityFilter = document.getElementById("cityFilter");

  const keyword = (searchInput?.value || "").trim().toLowerCase();
  const city = (cityFilter?.value || "").trim().toLowerCase();

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

    const matchesCity = !city || (job.location || "").toLowerCase().includes(city);

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
  cityFilter?.addEventListener("input", renderFilteredJobs);
}

// ---------- Admin page ----------
function getAdminPassword() {
  return document.getElementById("adminPassword")?.value || "";
}

// Admin ke "City" dropdown ko bhi usi master Pakistan city list se bharta hai,
// aakhir mein "Remote" already list mein hai, aur "Other" manually add karte hain.
function populateAdminCityDropdown() {
  const citySelect = document.getElementById("location");
  if (!citySelect) return;

  const options = PAKISTAN_CITIES.map((c) => `<option value="${c}">${c}</option>`).join("");

  citySelect.innerHTML =
    `<option value="">-- Shehar Muntakhib Karein --</option>` +
    options +
    `<option value="Other">Other (khud likhein)</option>`;
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

// Image field ke liye chuni gayi file ka naam/preview dikhana
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
      msgEl.textContent = "Pehle admin password likhein.";
      return;
    }

    const citySelect = document.getElementById("location");
    const otherCityInput = document.getElementById("otherCity");
    const finalCity =
      citySelect.value === "Other" ? otherCityInput.value.trim() : citySelect.value;

    // FormData istemal karte hain taake job advertisement image bhi
    // bhej sakein (multipart/form-data), sirf JSON text nahi.
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
          // Content-Type set NAHI karte — browser khud multipart
          // boundary ke saath set karega jab FormData bhejte hain.
        },
        body: formData,
      });

      if (res.status === 401) {
        msgEl.style.color = "#c0392b";
        msgEl.textContent = "Password ghalat hai.";
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "failed");
      }

      msgEl.style.color = "#2F7A6F";
      msgEl.textContent = "Job add ho gayi!";
      form.reset();
      document.getElementById("otherCityWrap").style.display = "none";
      const previewEl = document.getElementById("imagePreviewName");
      if (previewEl) previewEl.textContent = "";
      loadAdminJobs();
    } catch (err) {
      msgEl.style.color = "#c0392b";
      msgEl.textContent = err.message || "Kuch masla hua, dobara try karein.";
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
