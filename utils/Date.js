// Utility function to get the current time and end of the current week
function getStartAndEndOfWeek() {
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);
  return { now, endOfWeek };
}
module.exports = getStartAndEndOfWeek;
