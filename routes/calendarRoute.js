const express = require("express");

const authServices = require("../services/authServices");
const {
  getLoggedUserCalendar,
  addEventToCalendar,
  removeEventFromCalender,
} = require("../services/calendarService");
const {
  addEventToCalendarValidator,
  removeEventFromCalendarValidator,
} = require("../utils/validators/calendarValidator");

const router = express.Router();

router.use(authServices.protect, authServices.allowTo("admin", "user"));

router
  .route("/")
  .get(getLoggedUserCalendar)
  .post(addEventToCalendarValidator, addEventToCalendar);
router.delete(
  "/:eventId",
  removeEventFromCalendarValidator,
  removeEventFromCalender
);

module.exports = router;
