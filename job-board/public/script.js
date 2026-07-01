// ---------- Public homepage ----------
async function loadPublicJobs() {
  const listEl = document.getElementById("jobList");
  if (!listEl) return;

  try {
    const res = await fetch("/api/jobs");
    const jobs = await res.json();

    if (jobs.length === 0) {
      listEl.innerHTML = `<p style="text-align:center; color:#6B665C;">Filhaal koi job available nahi hai.</p>`;
      return;
    }

    listEl.innerHTML = jobs
      .map(
        (job) => `
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
    `
      )
      .join("");
  } catch (err) {
    listEl.innerHTML = `<p>Jobs load nahi ho sakin. Server check karein.</p>`;
  }
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
      <span>${job.title} — ${job.company}</span>
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

    const payload = {
      title: document.getElementById("title").value,
      company: document.getElementById("company").value,
      location: document.getElementById("location").value,
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
      loadAdminJobs();
    } catch (err) {
      msgEl.style.color = "#c0392b";
      msgEl.textContent = "Kuch masla hua, dobara try karein.";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadPublicJobs();
  loadAdminJobs();
  setupAdminForm();
});
