function daysLeft(date) {
  const today = new Date();
  const deadline = new Date(date);
  return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
}

function urgencyClass(days) {
  if (days < 3) return "urgent";
  if (days <= 7) return "warning";
  if (days <= 14) return "soon";
  return "safe";
}