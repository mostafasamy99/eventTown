const express = require('express');

const authServices = require('../services/authServices');
const {
  getNotifications,
  getNotification,
  createNotification,
  updateNotification,
  deleteNotification,
} = require('../services/notificationsService');
const {
  createNotificationValidator,
  getNotificationValidator,
  updateNotificationValidator,
  deleteNotificationValidator,
} = require('../utils/validators/notificationsValidator');

const router = express.Router();

router.use(authServices.protect, authServices.allowTo('admin', 'user'));

router
    .route('/')
    .get(getNotifications)
    .post(createNotificationValidator, createNotification);

router
    .route('/:id')
    .get(getNotificationValidator, getNotification)
    .put(updateNotificationValidator, updateNotification)
    .delete(deleteNotificationValidator, deleteNotification);

module.exports = router;