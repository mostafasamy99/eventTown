// createNotificationValidator,
// getNotificationValidator,
// updateNotificationValidator,
// deleteNotificationValidator,

const { body, check } = require('express-validator');
const Notification = require('../../models/notificationModel');
const ApiError = require('../apiError');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createNotificationValidator = [
  body('title').notEmpty().withMessage('Title is required').isLength({ min: 3 }).withMessage('Title is too short'),
  body('message').notEmpty().withMessage('Message is required').isLength({ min: 3 }).withMessage('Message is too short'),
  body('type').notEmpty().withMessage('Type is required').isIn(['custom', 'automatic']).withMessage('Invalid type'),
  body('scheduledFor').optional().isISO8601().withMessage('Invalid date format'),
  body('categories').optional().isArray().withMessage('Categories must be an array'),
  validatorMiddleware,
];

exports.getNotificationValidator = [
  check('id')
    .notEmpty()
    .withMessage('ID is required')
    .isMongoId()
    .withMessage('Invalid ID format')
    .custom(id =>
      Notification.findById(id).then(notification => {
        if (!notification) {
          return Promise.reject(new ApiError(`No notification found for this id : ${id}`, 404));
        }
      })
    ),
  validatorMiddleware,
];

exports.updateNotificationValidator = [
  check('id')
    .notEmpty()
    .withMessage('ID is required')
    .isMongoId()
    .withMessage('Invalid ID format')
    .custom(id =>
      Notification.findById(id).then(notification => {
        if (!notification) {
          return Promise.reject(new ApiError(`No notification found for this id : ${id}`, 404));
        }
      })
    ),
  body('title').notEmpty().withMessage('Title is required').isLength({ min: 3 }).withMessage('Title is too short'),
  body('message').notEmpty().withMessage('Message is required').isLength({ min: 3 }).withMessage('Message is too short'),
  body('type').notEmpty().withMessage('Type is required').isIn(['automatic', 'custom']).withMessage('Invalid type'),
  validatorMiddleware,
];

exports.deleteNotificationValidator = [
  check('id')
    .notEmpty()
    .withMessage('ID is required')
    .isMongoId()
    .withMessage('Invalid ID format')
    .custom(id =>
      Notification.findById(id).then(notification => {
        if (!notification) {
          return Promise.reject(new ApiError(`No notification found for this id : ${id}`, 404));
        }
      })
    ),
  validatorMiddleware,
];

exports.sendNotificationValidator = [
  check('id')
    .notEmpty()
    .withMessage('ID is required')
    .isMongoId()
    .withMessage('Invalid ID format')
    .custom(id =>
      Notification.findById(id).then(notification => {
        if (!notification) {
          return Promise.reject(new ApiError(`No notification found for this id : ${id}`, 404));
        }
      })
    ),
  validatorMiddleware,
];
