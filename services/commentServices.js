const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const Comment = require("../models/commentModel");
const factory = require("./handllerFactory");

exports.setEventIdToBody = (req, res, next) => {
  if (!req.body.event) req.body.event = req.params.eventId;
  next();
};

exports.setUserIdToBody = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.createFilterobj = (req, res, next) => {
  let filterObject = {};
  if (req.params.eventId) filterObject = { event: req.params.eventId };
  req.filterObj = filterObject;
  next();
};

// @desc    Create new comment
// @router  POST /api/v1/comments
// @access  public/protected
exports.createComment = factory.createOne(Comment);

// @desc    Get All comments
// @router  POST /api/v1/comments
// @access  public/protected
exports.getAllComment = factory.getAll(Comment, "Comment");

// @desc    Get Specific comment
// @router  POST /api/v1/comments/:id
// @access  public/protected
exports.getOneComment = factory.getOne(Comment);

//TODO: Based on the client Requirments

// @desc    Update Specific comment
// @router  PUT /api/v1/comments/:id
// @access  private/protected
// exports.updateComment = factory.updateOne(Comment);

// @desc    Delete Specific comment
// @router  DELETE /api/v1/comments/:id
// @access  private/protected/admin
exports.deleteComment = factory.deleteOne(Comment);
