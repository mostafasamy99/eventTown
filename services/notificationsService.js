const asyncHandler = require('express-async-handler');
const ApiFeatures = require('../utils/apiFeatures');
const factory = require('./handllerFactory');
const Notification = require('../models/notificationModel');
const { sendToTopic } = require('./fcmService');
const userModel = require('../models/userModel');

exports.getNotifications = asyncHandler(async (req, res, next) => {
  const features = new ApiFeatures(Notification.find(), req.query).filter().sort().limitFields().paginate();

  const notifications = await features.query;

  res.status(200).json({
    status: 'success',
    results: notifications.length,
    data: notifications,
  });
});

exports.getNotification = factory.getOne(Notification);
exports.createNotification = asyncHandler(async (req, res, next) => {
  // get the catehory id from the request body
  const { categories } = req.body;
  // get the users who are subscribed to this category
  const users = await userModel.find({
    interests: {
      $in: categories,
    },
  });
  // create notification for each user
  // const notificationPromises = users.map(async user => {
  //   const notification = new Notification({
  //     title: req.body.title,
  //     body: req.body.body,
  //     user: user._id,
  //     type: 'custom',
  //     sentAt: new Date(),
  //   });

  //   await notification.save();
  // });
  // await Notification.deleteMany();
  const notifications = users.map(user => {
    const commonCategories = user.interests.map(e => e._id.toString()).filter(cat => categories.includes(cat));
    return new Notification({
      title: req.body.title,
      body: req.body.message,
      user: user._id,
      categories: commonCategories,
      isSent : true,

      type: 'custom',
      sentAt: new Date(),
    });
  });
  // save the notifications
  await Notification.insertMany(notifications);
  const newNotifications = await Notification.find();
  console.log(newNotifications);
  // send the notification to the tpics of the users
  categories.forEach(async cat => {
    await sendToTopic(cat, req.body.title, req.body.message);
  });

  res.status(201).json({
    status: 'success',
    message: 'Notification sent successfully',
  });
});
exports.updateNotification = factory.updateOne(Notification);
exports.deleteNotification = factory.deleteOne(Notification);
//
