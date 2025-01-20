const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const moment = require("moment");
const ApiError = require("../utils/apiError");
const asyncHandler = require("express-async-handler");
const ApiFeatures = require("../utils/apiFeatures");
const factory = require("./handllerFactory");
const sendEmail = require("../utils/sendEmail");
const Event = require("../models/eventModel");
const User = require("../models/userModel");

const getStartAndEndOfWeek = require("../utils/Date");

// Set Logged OrganizerId To Body
exports.setOrganizerIdToBody = (req, res, next) => {
  // Nested route
  if (!req.body.organizer) req.body.organizer = req.user._id;
  next();
};

// Set eventCategoryId To Body
exports.setEventCategoryIdToBody = (req, res, next) => {
  // Nested route
  if (!req.body.eventCategory)
    req.body.eventCategory = [req.params.eventCategoryId];
  next();
};

// Set Filter Object For User To Get Accepted Events
exports.setFilterObjectAcceptedAndFutureEventsForUsers = (req, res, next) => {
  if (!req.filterObj) {
    req.filterObj = {};
  }
  if (req.user.role === "user") {
    req.filterObj.eventStatus = "accepted";
    req.filterObj.eventEndTime = { $gte: Date.now() };
  }
  next();
};

// Set Filter Object To Get All Events On Specific Category.
exports.setFilterObjectForEventCategory = (req, res, next) => {
  if (!req.filterObj) {
    req.filterObj = {};
  }
  if (req.params.eventCategoryId) {
    req.filterObj.eventCategory = req.params.eventCategoryId;
  }
  next();
};

// Set Filter Object To Get All Events On My Area.
exports.setFilterObjectToGetEventInMyArea = (req, res, next) => {
  if (!req.filterObj) {
    req.filterObj = {};
  }
  if (req.params.location) {
    req.filterObj.eventLocation = req.user.location;
  }
  next();
};

// Set Filter Object To Get All Top Events.
exports.setFilterObjectToGetTopEvents = (req, res, next) => {
  if (!req.filterObj) {
    req.filterObj = {};
  }
  if (req.params.pro) {
    req.filterObj.organizerPlan = { $in: ["basic", "standard", "premium"] };
    req.filterObj.expirePlanDate = { $gte: new Date() };
  }
  next();
};

// Set Filter Object To Get All Events On This Week.
exports.setFilterObjectToGetEventsInThisWeek = (req, res, next) => {
  if (!req.filterObj) {
    req.filterObj = {};
  }
  if (req.params.date) {
    const { now, endOfWeek } = getStartAndEndOfWeek();
    req.filterObj.eventDate = { $gte: now, $lte: endOfWeek };
  }
  next();
};

// Set Filter Object To Get All Events Based On Interests.
exports.setFilterObjectToGetEventsBasedOnInterests = (req, res, next) => {
  if (!req.filterObj) {
    req.filterObj = {};
  }
  if (req.params.interests) {
    req.filterObj.eventCategory = { $in: req.user.interests };
  }
  next();
};
const { uploadSingleMedia } = require("../middlewares/uploadImageMiddleware");

//upload Single image
exports.uploadEventImage = uploadSingleMedia("eventImage", "image");

//image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (req.file) {
    const directoryPath = "uploads/events";
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
    const imageName = `event-${uuidv4()}-${Date.now()}.jpeg`;
    const imagePath = `uploads/events/${imageName}`;

    fs.writeFileSync(imagePath, req.file.buffer);

    //Save image into our db
    req.body.eventImage = imageName;
  }
  next();
});

// Convert Event Category To Array
exports.convertEventCategoryToArray = asyncHandler(async (req, res, next) => {
  if (req.body.eventCategory) {
    const { role } = req.user;
    const { eventCategory } = req.body;

    if (role === "admin") {
      if (!Array.isArray(eventCategory)) {
        req.body.eventCategory = [eventCategory];
      }
    } else {
      if (Array.isArray(eventCategory)) {
        return next(new ApiError("You can't add multiple categories", 400));
      }
      req.body.eventCategory = [eventCategory];
    }
  }
  next();
});

//@desc get list of Events
//@route GET /api/v1/events
//@access public
exports.getEvents = factory.getAll(Event, "Event");

//@desc get specific Event by id
//@route GET /api/v1/events/:id
//@access public
exports.getEvent = factory.getOne(Event);

// FIXME:
//@desc create Event
//@route POST /api/v1/events
//@access protect
exports.createEvent = factory.createOne(Event);

// exports.createEvent = asyncHandler(async (req, res, next) => {
//   // Combine date and time, then convert to moment objects
//   const startDateTime = moment(
//     `${req.body.eventDate} ${req.body.eventStartTime}`,
//     "DD MMMM YYYY hh:mm A"
//   );
//   const endDateTime = moment(
//     `${req.body.eventDate} ${req.body.eventEndTime}`,
//     "DD MMMM YYYY hh:mm A"
//   );

//   // Check if the appointment date is in the past
//   if (startDateTime.isSameOrBefore(moment(), "minute")) {
//     return res.status(400).json({ error: "Invalid appointment date or time" });
//   }

//   // Check if end time is earlier than start time
//   if (endDateTime.isBefore(startDateTime)) {
//     return res
//       .status(400)
//       .json({ error: "End time cannot be earlier than start time" });
//   }

//   req.body.eventStartTime = startDateTime.toDate();
//   req.body.eventEndTime = endDateTime.toDate();
//   req.body.organizer = req.user._id;

//   // Create a new schedule
//   const event = await Event.create(req.body);

//   res.json({ message: "Event was sent to the admin, follow you email", event });
// });

//@desc update specific Event
//@route PUT /api/v1/events/:id
//@access protect
exports.updateEvent = factory.updateOne(Event);

//@desc delete Event
//@route DELETE /api/v1/events/:id
//@access protect
exports.deleteEvent = factory.deleteOne(Event);

//@desc Accept Event
//@route PUT /api/v1/events/:id/accept
//@access private
exports.acceptEvent = asyncHandler(async (req, res, next) => {
  // 1-  check event exits or not
  let event = await Event.findById(req.params.id);
  if (!event) {
    return next(new ApiError(`No event for this id ${req.params.id}`, 404));
  }

  // 2- Check Status of Event if basic or standard or premium
  if (
    event.organizerPlan === "basic" ||
    event.organizerPlan === "premium" ||
    event.organizerPlan === "standard"
  ) {
    if (!req.body.expirePlanDate) {
      return next(new ApiError("Please provide expirePlanDate", 400));
    }
    if (
      new Date(req.body.expirePlanDate) < Date.now() ||
      new Date(req.body.expirePlanDate) <= event.eventEndTime
    ) {
      return next(
        new ApiError(
          "expire Plan Date must be greater than `event end time` and must be in the future",
          400
        )
      );
    }
    // Update event with expirePlanDate change status of invitation and make it accepted
    event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        eventStatus: "accepted",
        expirePlanDate: req.body.expirePlanDate,
      },
      { new: true }
    );
  } else {
    // change status of invitation and make it accepted
    event = await Event.findByIdAndUpdate(
      req.params.id,
      { eventStatus: "accepted" },
      { new: true }
    );
  }
  // 2-  send accepted mail to this organizer
  const message = `Hi ${event.organizerName},
  \n Congratulations,  .
  \n We are accepted your event that called ${event.eventName}.
    \n  the ${process.env.EMAIL_FROM} Team`;
  try {
    await sendEmail({
      email: event.organizationEmail,
      subject: `Congratulations, ${process.env.EMAIL_FROM} accept your event`,
      message,
    });
  } catch (err) {
    return next(new ApiError("There is an error in sending email", 500));
  }
  res.status(200).json({
    status: "Success, event accepted",
    event,
    message: "Email send to the organizer success ",
  });
});

//@desc Reject Event
//@route DELETE /api/v1/events/:id/reject
//@access private
exports.rejectEvent = asyncHandler(async (req, res, next) => {
  // 1-  check event exits or not and change status of invitation and make it Rejected
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { eventStatus: "rejected" },
    { new: true }
  );
  if (!event) {
    return next(new ApiError(`No event for this id ${req.params.id}`, 404));
  }
  // 3-  send accepted mail to this organizer
  const message = `Hi ${event.organizerName},
    \n Unfortunately,  .
    \n We are rejected your event that called ${event.eventName}.
      \n  The ${process.env.EMAIL_FROM} Team`;
  try {
    await sendEmail({
      email: event.organizationEmail,
      subject: `Unfortunately, ${process.env.EMAIL_FROM} reject your event`,
      message,
    });
  } catch (err) {
    return next(new ApiError("There is an error in sending email", 500));
  }
  res.status(200).json({
    status: "Success, event rejected",
    event,
    message: "Email send to the organizer success ",
  });
});

// TODO:
// FIXME:

//@desc add Event To Calendar
//@route PUT /api/v1/events/:id/addToCalendar
//@access proteced
// exports.addEventToCalendar = asyncHandler(async (req, res, next) => {
//   // 1- Check if event exists
//   const event = await Event.findById(req.params.id);
//   if (!event) {
//     return next(new ApiError(`No event found with ID ${req.params.id}`, 404));
//   }

//   // 2- Check if the event is already in the user's calendar
//   const user = await User.findById(req.user._id);
//   if (!user) {
//     return next(new ApiError("No user found", 404));
//   }

//   const isEventInCalendar = user.calendar.includes(req.params.id);

//   // 3- Add event to user's calendar if it's not already there
//   if (!isEventInCalendar) {
//     user.calendar.push(req.params.id);
//     await user.save();

//     // 4- Increment number of going users
//     event.numberOfGoingUsers += 1;
//     await event.save();

//     res.status(200).json({
//       status: "success",
//       message:
//         "Event successfully added to your calendar. You can see it in your calendar.",
//       calendar: user.calendar,
//     });
//   } else {
//     res.status(200).json({
//       status: "success",
//       message:
//         "Event is already in your calendar. You can see it in your calendar.",
//       calendar: user.calendar,
//     });
//   }
// });

// TODO:
// FIXME:
// exports.getLoggedUserCalendar = asyncHandler(async (req, res, next) => {
//   const user = await User.findById(req.user._id).populate({
//     path: "calendar",
//     select:
//       "eventName eventDate eventStartTime eventEndTime eventLocation eventPrice",
//   });

//   res.status(200).json({
//     status: "success",
//     // result: user.wishlist.length,
//     data: user.calendar,
//   });
// });
