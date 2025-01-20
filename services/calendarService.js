const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");

const User = require("../models/userModel");
const Event = require("../models/eventModel");

//@desc add Event to wishlist
//@route POST /api/v1/wishlist
//@access protected/user
// exports.addEventToWishlist = asyncHandler(async (req, res, next) => {
//   const user = await User.findByIdAndUpdate(
//     req.user._id,
//     {
//       // add item to array
//       // if you tying to add an item to wishlist and this item is already existing $addToSet will be ignored
//       $addToSet: { calendar: req.body.eventId },
//     },
//     { new: true }
//   );
//   if (!user) {
//     return ApiError("no user found", 404);
//   }
//   res.status(200).json({
//     status: "success",
//     message: "event added successfully to your wishlist",
//     data: user.wishlist,
//   });
// });

//FIXME: adjust save trigger in this service to be updateOne.
//@desc add Event to Calendar
//@route POST /api/v1/calendar
//@access protected/user
exports.addEventToCalendar = asyncHandler(async (req, res, next) => {
  // 1- Check if event exists
  let event = await Event.findById(req.body.eventId);
  if (!event) {
    return next(
      new ApiError(`No event found with ID ${req.body.eventId}`, 404)
    );
  }

  // 2- Check if the event is already in the user's calendar
  let user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError("No user found", 404));
  }

  const isEventInCalendar = user.calendar.includes(req.body.eventId);

  // 3- Add event to user's calendar if it's not already there
  if (!isEventInCalendar) {
    user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { calendar: req.body.eventId },
      },
      {
        new: true,
      }
    );
    // user.calendar.push(req.body.eventId);
    // await user.save();

    // 4- Increment number of going users
    await Event.updateOne(
      { _id: event._id },
      { $inc: { numberOfGoingUsers: 1 } }
    );
    // event.numberOfGoingUsers += 1;
    // await event.save();

    res.status(200).json({
      status: "success",
      message:
        "Event successfully added to your calendar. You can see it in your calendar.",
      calendar: user.calendar,
    });
  } else {
    res.status(200).json({
      status: "success",
      message:
        "Event is already in your calendar. You can see it in your calendar.",
      calendar: user.calendar,
    });
  }
});

//@desc get logged user calendar
//@route GET /api/v1/calendar
//@access protected/user
exports.getLoggedUserCalendar = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate({
    path: "calendar",
    match: {
      eventEndTime: { $gte: Date.now() },
      eventStatus: "accepted",
    },
    select:
      "eventName eventImage eventDate eventStartTime eventEndTime eventLocation eventAddress numberOfGoingUsers eventPrice",
  });

  res.status(200).json({
    status: "success",
    result: user.calendar.length,
    data: user.calendar,
  });
});

//@desc remove event from user calendar
//@route DELETE /api/v1/calendars/:eventId
//@access protected/user
exports.removeEventFromCalender = asyncHandler(async (req, res, next) => {
  // 1- Check if the event is already in the user's calendar
  let user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError("No user found", 404));
  }

  // 1- Check if event exists
  let event = await Event.findById(req.params.eventId);
  if (!event) {
    return next(
      new ApiError(`No event found with ID ${req.params.eventId}`, 404)
    );
  }

  const isEventInCalendar = user.calendar.includes(req.params.eventId);
  if (!isEventInCalendar) {
    res.status(200).json({
      status: "success",
      message: "Event trying to remove is not in your calendar.",
      calendar: user.calendar,
    });
  }
  user = await User.findByIdAndUpdate(
    req.user._id,
    {
      //remove an item from wish list array if exists
      $pull: { calendar: req.params.eventId },
    },
    { new: true }
  );

  // 4- Decrement number of going users
  await Event.updateOne(
    { _id: event._id },
    { $inc: { numberOfGoingUsers: -1 } }
  );
  res.status(200).json({
    status: "success",
    message: "event removed successfully from your calendar",
    data: user.calendar,
  });
});
