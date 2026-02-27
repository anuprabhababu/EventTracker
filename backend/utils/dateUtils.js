function calculateDaysLeft(deadline) {
  const today = new Date();
  const d = new Date(deadline);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

module.exports = { calculateDaysLeft };