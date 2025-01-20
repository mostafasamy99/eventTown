const { check } = require("express-validator");
const slugify = require("slugify");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const phonenumberformate = require("../PhoneNumberFormate");
const User = require("../../models/userModel");
const Category = require("../../models/categoryModel");

exports.signupValidator = [
  check("name")
    .custom((name, { req }) => (req.body.slug = slugify(name)))
    .notEmpty()
    .withMessage("name Required")
    .isLength({ min: 3 })
    .withMessage("Too short user name"),

  check("email")
    .notEmpty()
    .withMessage("email Required")
    .isEmail()
    .withMessage("invalid email address")
    .toLowerCase()
    .custom((val) =>
      User.findOne({ email: val }).then((email) => {
        if (email) {
          throw new Error("E-mail already exists");
        }
      })
    ),
  check("password")
    .notEmpty()
    .withMessage("Password Required")
    .isLength({ min: 8 })
    .withMessage("Too short password"),

  check("confirmPassword")
    .notEmpty()
    .withMessage("confirm Password required")
    .custom((val, { req }) => {
      if (val != req.body.password) {
        throw new Error("password Confirmation not match password");
      }
      return true;
    }),
  check("interests")
    .notEmpty()
    .withMessage("Interests are required")
    .isArray({ max: 5 })
    .withMessage("The maximum number of interests is five")
    .custom(async (categoriesIds) => {
      const categories = await Category.find({
        _id: { $in: categoriesIds },
      });
      if (!categories || categories.length !== categoriesIds.length) {
        throw new Error("Invalid category IDs");
      }
    }),

  check("phone")
    .isMobilePhone(phonenumberformate())
    .withMessage("Phone number must be a real phone number"),

  check("gender").isString().withMessage("gender must be a text"),
  check("location").isString().withMessage("location must be a text"),
  // fcmToken
  check("fcmToken").isString().withMessage("fcmToken must be a text"),

  validatorMiddleware,
];
exports.resendCodeValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email Reauired")
    .isEmail()
    .withMessage("Please enter a valid email address"),
  validatorMiddleware,
];
exports.loginValidator = [
  check("email")
    .notEmpty()
    .withMessage("email reauired")
    .isEmail()
    .withMessage("invalid email address"),
  check("password")
    .notEmpty()
    .withMessage("Password required")
    .isLength({ min: 8 })
    .withMessage("Too short password"),
    // fcm
  check("fcmToken").isString().withMessage("fcmToken must be a text"),
  validatorMiddleware,
];
exports.verifyEmailCodeValidator = [
  check("emailVerifyCode")
    .notEmpty()
    .withMessage("email Verify Code required")
    .isLength({ min: 6 })
    .withMessage("email Verify Code must be 6 numbers")
    .isLength({ max: 6 })
    .withMessage("email Verify Code must be 6 numbers"),
  validatorMiddleware,
];
exports.forgotPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email Reauired")
    .isEmail()
    .withMessage("Please enter a valid email address"),
  validatorMiddleware,
];

exports.verifyPassResetCodeValidator = [
  check("resetCode")
    .notEmpty()
    .withMessage("Reset code required")
    .isLength({ min: 6 })
    .withMessage("reset code must be 6 numbers")
    .isLength({ max: 6 })
    .withMessage("reset code must be 6 numbers"),
  validatorMiddleware,
];

exports.resetPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email Required")
    .isEmail()
    .withMessage("Please enter a valid email address"),
  check("newPassword")
    .notEmpty()
    .withMessage("new Password required")
    .isLength({ min: 8 })
    .withMessage("Too short password"),
  validatorMiddleware,
];
