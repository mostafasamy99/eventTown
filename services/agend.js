const Agenda = require('agenda');
const Notification = require('../models/notificationModel');
const Event = require('../models/eventModel');
const User = require('../models/userModel');
const { sendNotification } = require('./fcmService');
const logger = require('../config/logger'); // Assume a logging utility

// Configuration constants
const NOTIFICATION_CONFIGS = {
  DAILY_FAVORITE: {
    timeframe: 2,
    message: eventName => `Reminder: The event "${eventName}" you're interested in is happening soon! It will start in less than 48 hours.`,
  },
  DAILY_CALENDAR: {
    timeframe: 1,
    message: eventName => `Reminder: The event "${eventName}" you're interested in is happening soon! It will start in less than 24 hours.`,
  },
  WEEKLY: {
    timeframe: 7,
    message: eventName => `Reminder: The event "${eventName}" you're interested in is happening soon! It will start in less than 7 days.`,
  },
};

// Centralized notification processing
async function processEventNotifications(config) {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(now.getDate() + config.timeframe);

  try {
    // Find events within specified timeframe
    const upcomingEvents = await Event.find({
      eventDate: { $gte: now, $lte: futureDate },
    });

    // Batch process notifications
    const notificationPromises = upcomingEvents.map(async event => {
      // Find users interested in the event
      const usersToNotify = await User.find({
        $or: [{ wishlist: event._id }, { calendar: event._id }],
      });

      // Process notifications for each user
      return Promise.all(
        usersToNotify.map(async user => {
          try {
            // Create notification
            const notification = new Notification({
              title: `Upcoming Event: ${event.eventName}`,
              body: config.message(event.eventName),
              event: event._id,
              user: user._id,
              type: 'automatic',
              sentAt: new Date(),
            });

            await notification.save();

            // Send push notifications
            if (user.fcmToken) {
              await Promise.all(sendNotification(user.fcmToken, notification.title, notification.body));
            }

            logger.info(`Notification sent for event: ${event.eventName} to user: ${user._id}`);
          } catch (userNotificationError) {
            logger.error(`Failed to send notification for event ${event.eventName}`, userNotificationError);
          }
        })
      );
    });

    await Promise.all(notificationPromises);
  } catch (error) {
    logger.error('Error processing event notifications', error);
  }
}

// Initialize Agenda
const agenda = new Agenda({
  db: { address: process.env.DB_URL },
  maxConcurrentJobs: 1, // Prevent overlapping jobs
});

// Define job handlers using centralized processing function
agenda.define('daily upcoming favorite events notification', () => processEventNotifications(NOTIFICATION_CONFIGS.DAILY_FAVORITE));

agenda.define('daily upcoming calendar events notification', () => processEventNotifications(NOTIFICATION_CONFIGS.DAILY_CALENDAR));

agenda.define('weekly upcoming events notification', () => processEventNotifications(NOTIFICATION_CONFIGS.WEEKLY));

// Optional diagnostic job
agenda.define('system health check', async () => {
  const eventCount = await Event.countDocuments();
  const userCount = await User.countDocuments();
  logger.info(`System Health: Events: ${eventCount}, Users: ${userCount}`);
});

// Start agenda scheduler
module.exports.startAgenda = async function () {
  try {
    await agenda.start();

    // Schedule jobs
    agenda.every('0 0 * * *', 'daily upcoming favorite events notification');
    agenda.every('0 0 * * *', 'daily upcoming calendar events notification');
    agenda.every('0 0 * * 5', 'weekly upcoming events notification');
    agenda.every('0 12 * * *', 'system health check'); // Daily at noon

    logger.info('Agenda job scheduler started successfully');
  } catch (error) {
    logger.error('Failed to start agenda scheduler', error);
    await agenda.cancel();
  }
};
