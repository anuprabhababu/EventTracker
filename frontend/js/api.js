const API = "https://expp-zefs.onrender.com";

async function getEvents() {
  const res = await fetch(`${API}/events`);
  return await res.json();
}

async function addEvent(data) {
  const res = await fetch(`${API}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return await res.json();
}

async function deleteEvent(id) {
  await fetch(`${API}/events/${id}`, { method: "DELETE" });
}

async function uploadFile(file, type) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API}/upload/${type}`, {
    method: "POST",
    body: formData
  });

  return await res.json();
}