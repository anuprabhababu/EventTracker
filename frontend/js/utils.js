function daysLeft(deadline) {
  const today = new Date();
  const d = new Date(deadline);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

function getUrgencyClass(days) {
  if (days < 3) return "urgent";
  if (days <= 7) return "warning";
  if (days <= 14) return "soon";
  return "safe";
}