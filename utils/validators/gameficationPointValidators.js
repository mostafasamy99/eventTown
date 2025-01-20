const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const phonenumberformate = require("../PhoneNumberFormate");

exports.addPointsValidator = [
  check("points")
    .isNumeric()
    .withMessage("Points must be a number")
    .isInt({ min: 0, max: 1000 })
    .withMessage("Points must be between 0 and 1000"),
  validatorMiddleware,
];

exports.requestFreeTicketValidator = [
  check("name").notEmpty().withMessage("Please provide your name"),
  check("email")
    .notEmpty()
    .withMessage("Please provide your email")
    .isEmail()
    .withMessage("Please provide a valid email"),
  check("phone")
    .notEmpty()
    .withMessage("Please provide your phone number")
    .isMobilePhone(phonenumberformate())
    .withMessage("Phone number must be a real phone number"),
  check("address").notEmpty().withMessage("Please provide your address"),
  check("event1")
    .notEmpty()
    .withMessage("Please provide event1")
    .isMongoId()
    .withMessage("Please provide a valid event1"),
  check("event2")
    .notEmpty()
    .withMessage("Please provide event2")
    .isMongoId()
    .withMessage("Please provide a valid event2"),
  check("event3")
    .notEmpty()
    .withMessage("Please provide event3")
    .isMongoId()
    .withMessage("Please provide a valid event3"),
  validatorMiddleware,
];
