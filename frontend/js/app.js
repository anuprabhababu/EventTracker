const BASE_URL = "http://localhost:5000/api";

let allEvents = [];
let editingEventId = null;

let currentCategory = "all";
let currentStatus = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadEvents();
  setupForm();
}

/* ================= LOAD EVENTS ================= */

async function loadEvents() {
  try {
    allEvents = await getEvents();

    applyFilters();
    updateStats();
    renderPriority();

    // 🔔 Reminder Logic
    allEvents.forEach(e => {

      if (!e.reminder) return;
      if (e.status === "Attended") return;

      const days = daysLeft(e.registration_deadline);

      if (days <= 1 && days >= 0) {

        const reminderKey = `reminded_${e.id}`;

        if (!sessionStorage.getItem(reminderKey)) {
          alert(`🔔 Reminder: "${e.name}" deadline is near!`);
          sessionStorage.setItem(reminderKey, "true");
        }
      }

    });

  } catch (err) {
    console.error("Load error:", err);
  }
}

/* ================= FILTERING ================= */

function setFilter(category) {
  currentCategory = category;
  currentStatus = null;
  applyFilters();
}

function setStatusFilter(status) {
  currentStatus = status;
  applyFilters();
}

function applyFilters() {
  let filtered = [...allEvents];

  if (currentCategory !== "all" && currentCategory !== "priority") {
    filtered = filtered.filter(e =>
      e.category && e.category.toLowerCase() === currentCategory
    );
  }

  if (currentStatus) {
    filtered = filtered.filter(e =>
      e.status === currentStatus
    );
  }

  if (currentCategory === "priority") {
    filtered.sort((a, b) =>
      daysLeft(a.registration_deadline) -
      daysLeft(b.registration_deadline)
    );
  }

  renderEvents(filtered);
}

/* ================= RENDER EVENTS ================= */

function renderEvents(events) {
  const grid = document.querySelector(".events-grid");
  grid.innerHTML = "";

  if (!events.length) {
    grid.innerHTML = "<p>No events found.</p>";
    return;
  }

  events.forEach(e => {
    const days = daysLeft(e.registration_deadline);
    const urgency = urgencyClass(days);

    grid.innerHTML += `
      <div class="event-card ${urgency}" onclick="openDetail('${e.id}')">
        <div class="event-name">${e.name}</div>
        <div class="event-source">via ${e.source}</div>
        <div class="countdown">${days} days left</div>
      </div>
    `;
  });
}

/* ================= UPDATE STATS ================= */

function updateStats() {
  document.getElementById("totalCount").textContent = allEvents.length;

  const urgent = allEvents.filter(e =>
    daysLeft(e.registration_deadline) <= 7 &&
    e.status !== "Attended"
  );
  document.getElementById("urgentCount").textContent = urgent.length;

  const registered = allEvents.filter(e =>
    e.status === "Registered"
  );
  document.getElementById("registeredCount").textContent = registered.length;

  const pendingCert = allEvents.filter(e =>
    e.status === "Attended" && !e.certificate_url
  );
  document.getElementById("certificatePending").textContent = pendingCert.length;
}

/* ================= PRIORITY ================= */

function renderPriority() {
  const container = document.getElementById("priorityList");
  container.innerHTML = "";

  const activeEvents = allEvents.filter(e =>
    e.status !== "Attended"
  );

  const sorted = activeEvents.sort((a, b) =>
    daysLeft(a.registration_deadline) -
    daysLeft(b.registration_deadline)
  );

  sorted.slice(0, 5).forEach((e, index) => {
    const days = daysLeft(e.registration_deadline);

    container.innerHTML += `
      <div class="priority-item">
        <div>#${index + 1}</div>
        <div>${e.name}</div>
        <div>${days} days</div>
      </div>
    `;
  });
}

/* ================= FORM ================= */

function setupForm() {
  const form = document.getElementById("eventForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const eventData = {
      name: document.getElementById("name").value,
      category: document.getElementById("category").value,
      source: document.getElementById("source").value,
      event_date: document.getElementById("event_date").value,
      registration_deadline: document.getElementById("registration_deadline").value,
      link: document.getElementById("link").value,
      notes: document.getElementById("notes").value,
      status: document.getElementById("status").value,
      reminder: document.getElementById("reminder")?.checked || false
    };

    try {
      if (editingEventId) {
        await fetch(`${BASE_URL}/events/${editingEventId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData)
        });
        editingEventId = null;
      } else {
        await addEvent(eventData);
      }

      closeModal();
      form.reset();
      await loadEvents();

    } catch (err) {
      console.error("Save error:", err);
    }
  });
}

/* ================= DETAIL ================= */

function openDetail(id) {
  const eventObj = allEvents.find(e => e.id === id);
  if (!eventObj) return;

  const modal = document.getElementById("detailModal");
  const content = document.getElementById("detailContent");

  content.innerHTML = `
    <h3>${eventObj.name}</h3>
    <p><strong>Status:</strong> ${eventObj.status}</p>

    <div style="margin:20px 0; display:flex; gap:10px;">
      <button onclick="window.open('${eventObj.link}', '_blank')">
        Open Registration
      </button>
      <button onclick="editEvent('${eventObj.id}')">Edit</button>
      <button onclick="deleteEventConfirmed('${eventObj.id}')">Delete</button>
    </div>

    <hr style="margin:20px 0;">

    <h4>🎓 Certificate</h4>

    ${
      eventObj.certificate_url
        ? `
          <button onclick="window.open('${eventObj.certificate_url}', '_blank')">
            Open Certificate
          </button>
          <button onclick="removeCertificate('${eventObj.id}')">
            Remove Certificate
          </button>
        `
        : `
          <input type="file" onchange="uploadCertificate(event, '${eventObj.id}')">
        `
    }
  `;

  modal.classList.add("open");
}

function closeDetail() {
  document.getElementById("detailModal").classList.remove("open");
}

/* ================= EDIT ================= */

function editEvent(id) {
  const eventObj = allEvents.find(e => e.id === id);
  if (!eventObj) return;

  document.getElementById("name").value = eventObj.name;
  document.getElementById("category").value = eventObj.category;
  document.getElementById("source").value = eventObj.source;
  document.getElementById("event_date").value = eventObj.event_date;
  document.getElementById("registration_deadline").value = eventObj.registration_deadline;
  document.getElementById("link").value = eventObj.link;
  document.getElementById("notes").value = eventObj.notes;
  document.getElementById("status").value = eventObj.status;
  document.getElementById("reminder").checked = eventObj.reminder || false;

  editingEventId = id;

  closeDetail();
  openModal();
}

/* ================= DELETE ================= */

async function deleteEventConfirmed(id) {
  if (!confirm("Delete this event?")) return;

  await deleteEvent(id);
  closeDetail();
  await loadEvents();
}

/* ================= CERTIFICATE ================= */

async function uploadCertificate(event, eventId) {
  const file = event.target.files[0];
  if (!file) return;

  const uploadRes = await uploadFile(file, "certificate");

  if (!uploadRes || !uploadRes.url) {
    alert("Upload failed.");
    return;
  }

  await fetch(`${BASE_URL}/events/${eventId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ certificate_url: uploadRes.url })
  });

  await loadEvents();
  openDetail(eventId);
}

async function removeCertificate(eventId) {
  if (!confirm("Remove certificate?")) return;

  await fetch(`${BASE_URL}/events/${eventId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ certificate_url: null })
  });

  await loadEvents();
  openDetail(eventId);
}