let currentCategory = "all";
let currentStatus = null;

function setFilter(category) {
  currentCategory = category;
  applyFilters();
}

function setStatusFilter(status) {
  currentStatus = status;
  applyFilters();
}

function applyFilters() {
  let filtered = [...allEvents];

  if (currentCategory !== "all") {
    filtered = filtered.filter(e =>
      e.category.toLowerCase() === currentCategory
    );
  }

  if (currentStatus) {
    filtered = filtered.filter(e =>
      e.status === currentStatus
    );
  }

  render(filtered);
}