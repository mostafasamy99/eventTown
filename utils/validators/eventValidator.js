const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Event = require("../../models/eventModel");
const User = require("../../models/userModel");
const Category = require("../../models/categoryModel");
const phonenumberformate = require("../PhoneNumberFormate");
const { default: mongoose } = require("mongoose");

// Middleware to check if the user is admin or not. If not, the request is rejected.
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    req.isAdmin = true;
  } else if (req.user && req.user.role === "user") {
    req.isAdmin = false;
  } else {
    return res.status(500).json({ message: "User information not found" });
  }
  next();
};

const notDuplicate = (arr) => {
  const seen = new Set();
  for (let i = 0; i < arr.length; i++) {
    if (seen.has(arr[i])) {
      throw new Error("Duplicate found for the value: " + arr[i]);
    }
    seen.add(arr[i]);
  }
  return true;
};
exports.createEventValidator = [
  // Check if user is admin or not
  isAdmin,

  // Apply common validations
  check("eventCategory")
    .isMongoId()
    .withMessage("Invalid event Category format")
    .custom(async (categories) => {
      if (notDuplicate(categories)) {
        // Check if all categories exist in the database
        for (const category of categories) {
          const categoryExists = await Category.findOne({ _id: category });
          if (!categoryExists) {
            // If a category is not found, throw an error
            throw new Error(`Category with ID ${category} does not exist.`);
          }
        }
        return true; // Validation passed
      }
    })

    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("event Category required"),
  check("organizerName")
    // .if((value, { req }) => !req.isAdmin)
    // .notEmpty()
    .isLength({ min: 2 })
    .withMessage("too short organizer Name")
    .isLength({ max: 32 })
    .withMessage("too long organizer Name"),

  check("organizationName")
    // .if((value, { req }) => !req.isAdmin)
    .isLength({ min: 2 })
    .withMessage("too short organization Name")
    .isLength({ max: 32 })
    .withMessage("too long organization Name"),

  check("organizationPhoneNumber")
    // .if((value, { req }) => !req.isAdmin)
    .isMobilePhone(phonenumberformate())
    .withMessage("Phone number must be a real phone number"),

  check("organizationEmail").isEmail().withMessage("Invalid email address"),

  check("organizationWebsite")
    .isURL()
    .withMessage("organization Website must be a valid URL"),
  check("eventName")
    .isLength({ min: 3 })
    .withMessage("Too short event Name")
    .isLength({ max: 32 })
    .withMessage("Too long event Name")
    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("Event required"),

  check("eventDate")
    .custom((val) => {
      if (new Date(val) <= Date.now()) {
        throw new Error("Event date must be in the future.");
      }
      return true;
    })
    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("Event date is required.")
    .bail(), // Stop if empty
  check("eventStartTime")
    .custom((val) => {
      if (new Date(val) <= Date.now()) {
        throw new Error("Event start time must be in the future.");
      }
      return true;
    })
    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("Event start time is required.")
    .bail(),
  check("eventEndTime")
    .custom((val, { req }) => {
      if (new Date(val) <= Date.now()) {
        throw new Error("Event end time must be in the future.");
      }
      if (new Date(val) <= new Date(req.body.eventStartTime)) {
        throw new Error("Event end time must greater than event start time.");
      }
      return true;
    })
    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("Event end time is required.")
    .bail(),
  check("eventLocation")
    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("event Location required"),

  check("eventImage")
    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("event Image Required"),
  check("organizerPlan")
    // .if((value, { req }) => !req.isAdmin)
    .optional()
    .isIn(["free", "basic", "standard", "premium"])
    .withMessage("organizer Plan must be free,basic,standard or premium   "),
  check("ticketEventLink")
    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("Ticket Event Link required")
    .isURL()
    .withMessage("organization Website must be a valid URL"),

  check("eventPrice")
    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("event price required")
    .isNumeric()
    .withMessage("event price must be a number"),

  validatorMiddleware,
];

exports.getEventValidator = [
  //rules
  check("id").isMongoId().withMessage("Invalid Event id format"),
  //catch error
  validatorMiddleware,
];

exports.updateEventValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid id formate")
    .custom(async (val, { req }) => {
      const event = await Event.findById(val);
      if (!event) {
        return Promise.reject(
          new Error(`There is no event for this id ${val}`)
        );
      }
    }),

  isAdmin,

  check("eventCategory")
    .optional()
    .notEmpty()
    .withMessage("event Category required")
    .isMongoId()
    .withMessage("Invalid event Category format")
    .custom((categories) => {
      // if(categories.length == 1 && categories[0] === undefined){
      //   return true
      // }
      if (notDuplicate(categories)) {
        // Check if all categories exist in the database
        const promises = categories.map((category) => {
          return Category.findOne({ _id: category }).then((categoryExists) => {
            if (!categoryExists) {
              // If a category is not found, throw an error
              return Promise.reject(
                new Error(`Category with ID ${category} does not exist.`)
              );
            }
          });
        });

        return Promise.all(promises).then(() => true); // Validation passed
      }
    }),
  check("organizerName")
    .optional()
    // .if((value, { req }) => !req.isAdmin)
    // .notEmpty()
    .isLength({ min: 2 })
    .withMessage("too short organizer Name")
    .isLength({ max: 32 })
    .withMessage("too long organizer Name"),

  check("organizationName")
    .optional()
    // .if((value, { req }) => !req.isAdmin)
    .isLength({ min: 2 })
    .withMessage("too short organization Name")
    .isLength({ max: 32 })
    .withMessage("too long organization Name"),

  check("organizationPhoneNumber")
    .optional()
    // .if((value, { req }) => !req.isAdmin)
    .isMobilePhone(phonenumberformate())
    .withMessage("Phone number must be a real phone number"),
  check("organizerPlan")
    .optional()
    .isIn(["free", "basic", "standard", "premium"]),
  check("organizationEmail")
    .optional()
    .isEmail()
    .withMessage("Invalid email address"),

  check("organizationWebsite")
    .optional()
    .isURL()
    .withMessage("organization Website must be a valid URL"),

  check("eventName")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short event Name")
    .isLength({ max: 32 })
    .withMessage("Too long event Name")
    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("Event required"),

  check("eventDate")
    .optional()
    .custom((val) => {
      if (new Date(val) <= Date.now()) {
        throw new Error("Event date must be in the future.");
      }
      return true;
    })
    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("event Date required"),

  check("eventStartTime")
    .optional()
    .custom((val) => {
      if (new Date(val) <= Date.now()) {
        throw new Error("Event Start date time must be in the future.");
      }
      return true;
    })
    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("event Start Time required"),

  check("eventEndTime")
    .optional()
    .custom((val, { req }) => {
      if (new Date(val) <= Date.now()) {
        throw new Error("Event end date time must be in the future.");
      }
      if (new Date(val) <= new Date(req.body.eventStartTime)) {
        throw new Error("Event end time must greater than event start time.");
      }
      return true;
    })
    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("event End Time required"),
  check("expirePlanDate")
    .optional()
    .custom((val, { req }) => {
      const expirePlanDate = new Date(val);
      const eventEndTime = new Date(req.body.eventEndTime);

      // Validate if `val` is a valid date
      if (isNaN(expirePlanDate.getTime())) {
        throw new Error("Invalid date format for `expirePlanDate`.");
      }

      if (expirePlanDate <= Date.now() || expirePlanDate <= eventEndTime) {
        throw new Error(
          "Expire Plan Date must be greater than `event end time` and must be in the future."
        );
      }

      return true; // Validation passed
    }),

  check("eventLocation")
    .optional()
    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("event Location required"),

  check("eventImage").optional().notEmpty().withMessage("event Image Required"),

  check("ticketEventLink")
    .optional()
    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("Ticket Event Link required")
    .isURL()
    .withMessage("organization Website must be a valid URL"),

  check("eventPrice")
    .optional()
    .if((value, { req }) => !req.isAdmin)
    .notEmpty()
    .withMessage("event price required")
    .isNumeric()
    .withMessage("event price must be a number"),

  validatorMiddleware,
];

exports.deleteEventValidator = [
  check("id").isMongoId().withMessage("Invalid Event id format"),
  validatorMiddleware,
];
