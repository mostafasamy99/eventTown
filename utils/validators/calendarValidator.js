const { body, check } = require("express-validator");
const Event = require("../../models/eventModel");
const ApiError = require("../apiError");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.addEventToCalendarValidator = [
  body("eventId")
    .notEmpty()
    .withMessage("event required")
    .isMongoId()
    .withMessage("Invalid ID format")
    .custom((eventId) =>
      Event.findOne({
        _id: eventId,
        eventEndTime: { $gte: Date.now() },
        eventStatus: "accepted",
      }).then((event) => {
        if (!event) {
          return Promise.reject(
            new ApiError(
              `No event found for this id : ${eventId} , or event is expired or not accepted`,
              404
            )
          );
        }
      })
    ),
  validatorMiddleware,
];

exports.removeEventFromCalendarValidator = [
  check("eventId")
    .notEmpty()
    .withMessage("event required")
    .isMongoId()
    .withMessage("Invalid ID format")
    .custom((eventId) =>
      Event.findById(eventId).then((event) => {
        if (!event) {
          return Promise.reject(
            new ApiError(`No event found found for this id : ${eventId}`, 404)
          );
        }
      })
    ),
  validatorMiddleware,
];
