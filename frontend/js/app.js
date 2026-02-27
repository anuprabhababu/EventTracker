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
    daysLeft(e.registration_deadline) <= 7
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

  const sorted = [...allEvents].sort((a, b) =>
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
      status: document.getElementById("status").value
    };

    try {
      if (editingEventId) {
        await fetch(`http://localhost:5000/api/events/${editingEventId}`, {
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
    <p><strong>Category:</strong> ${eventObj.category}</p>
    <p><strong>Source:</strong> ${eventObj.source}</p>
    <p><strong>Event Date:</strong> ${eventObj.event_date}</p>
    <p><strong>Deadline:</strong> ${eventObj.registration_deadline}</p>
    <p><strong>Status:</strong> ${eventObj.status}</p>

    <div style="margin-top:15px; display:flex; gap:10px;">
      <button onclick="window.open('${eventObj.link}')">Open</button>
      <button onclick="editEvent('${eventObj.id}')">Edit</button>
      <button onclick="deleteEventConfirmed('${eventObj.id}')">Delete</button>
    </div>

    <hr style="margin:20px 0;">

    <h4>📄 Upload Brochure</h4>
    <input type="file" onchange="uploadBrochure(event, '${eventObj.id}')">

    ${
      eventObj.brochure_url
        ? `<p><a href="${eventObj.brochure_url}" target="_blank">View Brochure</a></p>`
        : ""
    }

    <h4 style="margin-top:20px;">🎓 Upload Certificate</h4>
    <input type="file" onchange="uploadCertificate(event, '${eventObj.id}')">

    ${
      eventObj.certificate_url
        ? `<p><a href="${eventObj.certificate_url}" target="_blank">View Certificate</a></p>`
        : ""
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

/* ================= FILE UPLOAD ================= */

async function uploadBrochure(event, eventId) {
  const file = event.target.files[0];
  if (!file) return;

  const uploadRes = await uploadFile(file, "brochure");

  await fetch(`http://localhost:5000/api/events/${eventId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brochure_url: uploadRes.url })
  });

  await loadEvents();
}

async function uploadCertificate(event, eventId) {
  const file = event.target.files[0];
  if (!file) return;

  const uploadRes = await uploadFile(file, "certificate");

  await fetch(`http://localhost:5000/api/events/${eventId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ certificate_url: uploadRes.url })
  });

  await loadEvents();
}