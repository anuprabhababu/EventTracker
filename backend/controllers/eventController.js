/* ================= BACKEND CONFIG ================= */

const BASE_URL = "https://expp-zefs.onrender.com/api";

/* ================= SUPABASE CONFIG ================= */

const SUPABASE_URL = "https://zxaibceibivexxkiffnt.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ================= GLOBAL STATE ================= */

let allEvents = [];
let editingEventId = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadEvents();
  setupForm();
}

/* ================= LOAD EVENTS ================= */

async function loadEvents() {
  try {
    const res = await fetch(`${BASE_URL}/events`);
    allEvents = await res.json();

    renderEvents(allEvents);
    updateStats();
    runReminders();

  } catch (err) {
    console.error("Load error:", err);
  }
}

/* ================= RENDER EVENTS ================= */

function renderEvents(events) {
  const grid = document.querySelector(".events-grid");
  grid.innerHTML = "";

  events.forEach(e => {
    const daysLeft = Math.ceil(
      (new Date(e.registration_deadline) - new Date()) / (1000 * 60 * 60 * 24)
    );

    grid.innerHTML += `
      <div class="event-card" onclick="openDetail('${e.id}')">
        <div class="event-name">${e.name}</div>
        <div class="countdown">${daysLeft >= 0 ? daysLeft : 0} days left</div>
      </div>
    `;
  });
}

/* ================= REMINDER LOGIC ================= */

function runReminders() {
  allEvents.forEach(e => {
    if (e.status === "Attended") return;

    const daysLeft = Math.ceil(
      (new Date(e.registration_deadline) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft === 1) {
      alert(`🔔 Reminder: "${e.name}" deadline is tomorrow!`);
    }
  });
}

/* ================= DETAIL MODAL ================= */

function openDetail(id) {
  const eventObj = allEvents.find(e => e.id === id);
  if (!eventObj) return;

  const modal = document.getElementById("detailModal");
  const content = document.getElementById("detailContent");

  content.innerHTML = `
    <h3>${eventObj.name}</h3>
    <p><strong>Category:</strong> ${eventObj.category}</p>
    <p><strong>Status:</strong> ${eventObj.status}</p>
    <p><strong>Deadline:</strong> ${eventObj.registration_deadline}</p>

    <div style="margin-top:20px;">
      <button onclick="editEvent('${eventObj.id}')">Edit</button>
      <button onclick="deleteEventConfirmed('${eventObj.id}')">Delete</button>
    </div>

    <hr>

    <h4>📄 Certificate</h4>

    ${
      eventObj.certificate_url
        ? `<button onclick="window.open('${eventObj.certificate_url}', '_blank')">Open Certificate</button>`
        : `<input type="file" onchange="uploadCertificate(event, '${eventObj.id}')">`
    }
  `;

  modal.classList.add("open");
}

function closeDetail() {
  document.getElementById("detailModal").classList.remove("open");
}

/* ================= EDIT EVENT ================= */

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

/* ================= FORM SUBMIT ================= */

function setupForm() {
  const form = document.getElementById("eventForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const eventData = {
      name: name.value,
      category: category.value,
      source: source.value,
      event_date: event_date.value,
      registration_deadline: registration_deadline.value,
      link: link.value,
      notes: notes.value,
      status: status.value
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
        await fetch(`${BASE_URL}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData)
        });
      }

      form.reset();
      closeModal();
      await loadEvents();

    } catch (err) {
      console.error("Save error:", err);
    }
  });
}

/* ================= DELETE ================= */

async function deleteEventConfirmed(id) {
  if (!confirm("Delete this event?")) return;

  await fetch(`${BASE_URL}/events/${id}`, {
    method: "DELETE"
  });

  closeDetail();
  await loadEvents();
}

/* ================= CERTIFICATE UPLOAD ================= */

async function uploadFile(file, folder) {
  const fileName = `${folder}-${Date.now()}-${file.name}`;

  const { error } = await supabaseClient.storage
    .from("documents")
    .upload(fileName, file);

  if (error) {
    console.error(error);
    return null;
  }

  const { data } = supabaseClient.storage
    .from("documents")
    .getPublicUrl(fileName);

  return { url: data.publicUrl };
}

async function uploadCertificate(event, eventId) {
  const file = event.target.files[0];
  if (!file) return;

  const uploadRes = await uploadFile(file, "certificate");

  if (!uploadRes) {
    alert("Upload failed");
    return;
  }

  await fetch(`${BASE_URL}/events/${eventId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      certificate_url: uploadRes.url
    })
  });

  await loadEvents();
  openDetail(eventId);
}

/* ================= STATS ================= */

function updateStats() {
  document.getElementById("totalCount").textContent = allEvents.length;
}

/* ================= EXPORT FOR HTML ================= */

window.openDetail = openDetail;
window.closeDetail = closeDetail;
window.editEvent = editEvent;
window.deleteEventConfirmed = deleteEventConfirmed;
window.uploadCertificate = uploadCertificate;