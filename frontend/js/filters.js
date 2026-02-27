function filterByCategory(events, category) {
  if (category === 'all') return events;
  return events.filter(e => e.category.toLowerCase() === category);
}