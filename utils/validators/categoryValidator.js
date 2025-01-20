const { check, body } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Category = require("../../models/categoryModel");

exports.getCategoryValidator = [
  //rules
  check("id").isMongoId().withMessage("Invalid category id format"),
  //catch error
  validatorMiddleware,
];
exports.createCategroyValidator = [
  check("title")
    .notEmpty()
    .withMessage("category required")
    .isLength({ min: 3 })
    .withMessage("too short category title")
    .isLength({ max: 32 })
    .withMessage("too long category title")
    .custom((val) =>
      Category.findOne({ title: val }).then((category) => {
        if (category) {
          throw new Error(
            `category title already exists and must it to be unique`
          );
        }
      })
    ),

  validatorMiddleware,
];
exports.updateCategroyValidator = [
  check("id").isMongoId().withMessage("Invalid id formate"),
  check("title")
    .custom((val, { req }) =>
      Category.findOne({ title: val }).then((category) => {
        if (category) {
          if (category._id.toString() === req.params.id.toString()) {
            return true;
          } else {
            throw new Error(
              "Category title found on our database and it must be unique"
            );
          }
        }
      })
    )
    .notEmpty()
    .withMessage("Category required")
    .isLength({ min: 3 })
    .withMessage("Too short category title")
    .isLength({ max: 32 })
    .withMessage("Too long category title")
    .optional(),
  validatorMiddleware,
];
exports.deleteCategroyValidator = [
  check("id").isMongoId().withMessage("Invalid category id format"),
  validatorMiddleware,
];
