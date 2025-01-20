const { check, body } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const phonenumberformate = require("../PhoneNumberFormate");

exports.createOrganizerValidator = [
  body("organizerName")
    .trim()
    .notEmpty()
    .withMessage("Organizer name is required")
    .isLength({ min: 3 })
    .withMessage("Organizer name must be at least 3 characters long"),

  body("organizationName")
    .trim()
    .notEmpty()
    .withMessage("Organization name is required")
    .isLength({ min: 2 })
    .withMessage("Organization name must be at least 2 characters long"),

  body("organizationField").optional().trim(),

  body("organizationWebsite")
    .trim()
    .notEmpty()
    .withMessage("Organization website is required")
    .isURL()
    .withMessage("Invalid URL format for organization website"),

  body("organizationPhoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Organization phone number is required")
    .isMobilePhone(phonenumberformate())
    .withMessage("Organization phone number must be a valid 10-digit number"),

  body("organizationEmail")
    .trim()
    .notEmpty()
    .withMessage("Organization email is required")
    .isEmail()
    .withMessage("Invalid email format for organization email"),

  body("advice").optional().trim(),
  validatorMiddleware,
];

exports.updateOrganizerValidator = [
  check("id").isMongoId().withMessage("Invalid organizer id format"),
  body("organizerName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Organizer name is required")
    .isLength({ min: 3 })
    .withMessage("Organizer name must be at least 3 characters long"),

  body("organizationName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Organization name is required")
    .isLength({ min: 2 })
    .withMessage("Organization name must be at least 2 characters long"),

  body("organizationField").optional().trim(),

  body("organizationWebsite")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Organization website is required")
    .isURL()
    .withMessage("Invalid URL format for organization website"),

  body("organizationPhoneNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Organization phone number is required")
    .isMobilePhone(phonenumberformate())
    .withMessage("Organization phone number must be a valid 10-digit number"),

  body("organizationEmail")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Organization email is required")
    .isEmail()
    .withMessage("Invalid email format for organization email"),

  body("advice").optional().trim(),
  validatorMiddleware,
];

exports.deleteOrganizerValidator = [
  check("id").isMongoId().withMessage("Invalid organizer id format"),
  //catch error
  validatorMiddleware,
];

exports.getOrganizerValidator = [
  check("id").isMongoId().withMessage("Invalid organizer id format"),
  //catch error
  validatorMiddleware,
];
