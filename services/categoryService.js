/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
// const Course = require("../models/courseModel");
// const Lessons = require("../models/lessonModel");
// const Reviews = require("../models/reviewModel");
const Category = require("../models/categoryModel");
const Event = require("../models/eventModel");

const factory = require("./handllerFactory");

//@desc get list of categories
//@route GET /api/v1/categories
//@access public
exports.getCategories = factory.getAll(Category, "Category");

//@desc get specific category by id
//@route GET /api/v1/categories/:id
//@access public
exports.getCategory = factory.getOne(Category);

//@desc create category
//@route POST /api/v1/categories
//@access private
exports.createCategory = factory.createOne(Category);

//@desc update specific category
//@route PUT /api/v1/categories/:id
//@access private
exports.updateCategory = factory.updateOne(Category);

//@desc delete category
//@route DELETE /api/v1/categories/:id
//@access private
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Find and delete the category
    const category = await Category.findByIdAndDelete(req.params.id).session(
      session
    );

    // Check if category exists
    if (!category) {
      await session.abortTransaction();
      session.endSession();
      return next(
        new ApiError(`Category not found for this id ${req.params.id}`, 404)
      );
    }

    // Find and delete associated events
    await Event.deleteMany({ eventCategory: category._id }).session(session);

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Return success response
    res.status(204).send();
  } catch (error) {
    // Handle any transaction-related errors
    await session.abortTransaction();
    session.endSession();
    console.error("Transaction error:", error);
    return next(new ApiError("Error during transaction", 500));
  }
});
