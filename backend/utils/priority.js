const { calculateDaysLeft } = require('./dateUtils');

function sortByPriority(events) {
  return events.sort((a, b) => {
    return calculateDaysLeft(a.registration_deadline) -
           calculateDaysLeft(b.registration_deadline);
  });
}

module.exports = { sortByPriority };