document.addEventListener("DOMContentLoaded", load);

let allEvents = [];

async function load() {
  allEvents = await getEvents();
  render(allEvents);
}

function render(events) {
  const grid = document.querySelector(".events-grid");
  grid.innerHTML = "";

  events.forEach(e => {
    const days = daysLeft(e.registration_deadline);
    const urgency = urgencyClass(days);

    grid.innerHTML += `
      <div class="event-card ${urgency}">
        <div class="event-name">${e.name}</div>
        <div class="event-source">via ${e.source}</div>
        <div class="countdown">
          <span>${days} days left</span>
        </div>
        <button onclick="window.open('${e.link}')">Open</button>
        <button onclick="deleteEvent('${e.id}').then(load)">Delete</button>
      </div>
    `;
  });
  document.getElementById("eventForm").addEventListener("submit", async function(e) {
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

  await addEvent(eventData);
  closeModal();
  load();
});
}