const express = require("express");

const {
  getEventValidator,
  createEventValidator,
  updateEventValidator,
  deleteEventValidator,
} = require("../utils/validators/eventValidator");
const {
  getEvent,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  acceptEvent,
  rejectEvent,
  // addEventToCalendar,
  uploadEventImage,
  resizeImage,
  // setOrganizerIdToBody,
  
  setEventCategoryIdToBody,
  convertEventCategoryToArray,
  setFilterObjectToGetTopEvents,
  setFilterObjectForEventCategory,
  setFilterObjectToGetEventInMyArea,
  setFilterObjectToGetEventsInThisWeek,
  setFilterObjectToGetEventsBasedOnInterests,
  setFilterObjectAcceptedAndFutureEventsForUsers,
} = require("../services/eventServices");
const authServices = require("../services/authServices");
const commentRoute = require("./commentRoute");

const router = express.Router({ mergeParams: true });

router.use("/:eventId/comments", commentRoute);

router.use("/:pro/topEvents", router);
router.use("/:location/myArea", router);
router.use("/:date/thisWeek", router);
router.use("/:interests/forYou", router);


router.post(
  "/",
  authServices.protect,
  uploadEventImage,
  resizeImage,
  // setOrganizerIdToBody,
  setEventCategoryIdToBody,
  convertEventCategoryToArray,
  createEventValidator,
  createEvent
);

router.get(
  "/",
  authServices.protect,
  setFilterObjectAcceptedAndFutureEventsForUsers,
  setFilterObjectToGetTopEvents,
  setFilterObjectForEventCategory,
  setFilterObjectToGetEventInMyArea,
  setFilterObjectToGetEventsInThisWeek,
  setFilterObjectToGetEventsBasedOnInterests,
  getEvents
);

router.get("/:id", authServices.protect, getEventValidator, getEvent);

router.put(
  "/:id",
  authServices.protect,
  authServices.allowTo("admin"),
  uploadEventImage,
  resizeImage,
  convertEventCategoryToArray,
  updateEventValidator,
  updateEvent
);
router.delete(
  "/:id",
  authServices.protect,
  authServices.allowTo("admin"),
  deleteEventValidator,
  deleteEvent
);
router.put(
  "/:id/accept",
  authServices.protect,
  authServices.allowTo("admin"),
  acceptEvent
);
router.put(
  "/:id/reject",
  authServices.protect,
  authServices.allowTo("admin"),
  rejectEvent
);

// router.put("/:id/addToCalendar", authServices.protect, addEventToCalendar);



module.exports = router;
