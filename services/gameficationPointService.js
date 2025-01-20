const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const asyncHandler = require("express-async-handler");
const apiError = require("../utils/apiError");
const Point = require("../models/gameficationPointModel");
const RequestFreeTicket = require("../models/FreeTicketRequestModel");
const Event = require("../models/eventModel");
const sendEmail = require("../utils/sendEmail");
const GameficationComment = require("../models/gameficationCommentModels");

const { uploadSingleMedia } = require("../middlewares/uploadImageMiddleware");

//upload Single image
exports.uploadGameficationCommentImage = uploadSingleMedia("img", "image");

//image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (req.file) {
    const directoryPath = "uploads/gamefication/comments";
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
    const imageName = `gamefication-comment-${uuidv4()}-${Date.now()}.jpeg`;
    const imagePath = `uploads/gamefication/comments/${imageName}`;

    fs.writeFileSync(imagePath, req.file.buffer);

    //Save image into our db
    req.body.img = imageName;
  }
  next();
});

//@desc Add points to user's points
//@route POST /api/v1/gamefication/addPoints
//@access protected/user
exports.addPoints = asyncHandler(async (req, res, next) => {
  const { points } = req.body;

  let point = await Point.findOne({ user: req.user.id });

  if (!point) {
    await Point.create({ user: req.user.id, points });
  }
  // Check time now is over 24 hours from last update time
  // if not, update the points
  const currentTime = new Date();
  const lastUpdateTime = new Date(point.updatedAt);
  const timeDiff = currentTime - lastUpdateTime;
  const hoursDiff = timeDiff / (1000 * 60 * 60); // convert to hours
  if (hoursDiff < 24) {
    return next(
      new apiError("Cannot update points within 24 hours from last update", 400)
    );
  }
  let pointAfterUpdate = await Point.findOneAndUpdate(
    { user: req.user.id },
    { points: point.points + points > 1000 ? 1000 : point.points + points },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: "These points have been added successfully.",
    myPoints: pointAfterUpdate,
  });
});

//@desc     Get my points
//@route    GET /api/v1/gamefication/myPoints
//@access   protected/user
exports.getMyPoints = asyncHandler(async (req, res, next) => {
  const point = await Point.findOne({ user: req.user.id });
  if (!point) {
    return next(new apiError("You don't have any points", 404));
  }
  res.status(200).json({
    success: true,
    myPoints: point,
  });
});

//@desc     Request free ticket
//@route    POST /api/v1/gamefication/requestFreeTicket
//@access   protected/user
exports.requestFreeTicket = asyncHandler(async (req, res, next) => {
  const user = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
  };
  let events = [];
  const event1 = await Event.findOne({
    _id: req.body.event1,
    eventStatus: "accepted",
  });
  if (!event1) {
    return next(new apiError("Event1 not found or not accepted", 404));
  }
  events.push(event1._id);
  const event2 = await Event.findOne({
    _id: req.body.event2,
    eventStatus: "accepted",
  });
  if (!event2) {
    return next(new apiError("Event2 not found or not accepted", 404));
  }
  events.push(event2._id);
  const event3 = await Event.findOne({
    _id: req.body.event3,
    eventStatus: "accepted",
  });
  if (!event3) {
    return next(new apiError("Event3 not found or not accepted", 404));
  }
  events.push(event3._id);

  if (events.length !== 3) {
    return next(new apiError("You need to select 3 events", 400));
  }

  const point = await Point.findOne({ user: req.user.id });

  if (!point) {
    return next(new apiError("You don't have enough points", 400));
  }

  if (point.points !== 1000) {
    return next(
      new apiError("You need to have 1000 points to request a free ticket", 400)
    );
  }
  const request = await RequestFreeTicket.create({
    loggedUser: req.user._id,
    userInformation: user,
    events,
  });
  await Point.findOneAndUpdate({ user: req.user.id }, { points: 0 });
  res.status(200).json({
    success: true,
    message:
      "Your request has been sent successfully, awaiting admin approval.",
    request,
  });
});

//@desc     Get my requests
//@route    GET /api/v1/gamefication/myHistory
//@access   protected/user
exports.getMyRequests = asyncHandler(async (req, res, next) => {
  const requests = await RequestFreeTicket.find({
    loggedUser: req.user.id,
  });
  if (!requests) {
    return next(new apiError("You don't have any requests", 404));
  }

  const data = requests.map((request) => {
    const transformedEvents = request.events.map((event) => {
      return {
        eventName: event.eventName,
        eventImage: event.eventImage,
        eventDate: event.eventDate,
        eventStartTime: event.eventStartTime,
        eventEndTime: event.eventEndTime,
        eventLocation: event.eventLocation,
        eventAddress: event.eventAddress,
        numberOfGoingUsers: event.numberOfGoingUsers,
        eventPrice: event.eventPrice,
      };
    });
    return {
      _id: request._id,
      userInformation: request.userInformation,
      loggedUser: {
        _id: request.loggedUser._id,
        name: request.loggedUser.name,
        email: request.loggedUser.email,
        phone: request.loggedUser.phone,
        address: request.loggedUser.address,
        profileImg: request.loggedUser.profileImg,
        role: request.loggedUser.role,
      },
      events: transformedEvents,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  });

  res.status(200).json({
    success: true,
    myHistory: data,
  });
});

//desc Add Comment On Gamefication
//@route POST /api/v1/gamefication/addComment
//access    protected/user
exports.addCommentOnGamefication = asyncHandler(async (req, res, next) => {
  const request = await RequestFreeTicket.findOne({ loggedUser: req.user.id });
  if (!request) {
    return next(new apiError("You don't have any requests", 404));
  }
  if (request.status !== "accepted") {
    return next(
      new apiError(
        "You can't add a comment on a request that is not accepted",
        400
      )
    );
  }
  const payload = {
    ...req.body,
    user: req.user.id,
  };

  const gameficationComment = await GameficationComment.create(payload);
  res.status(201).json({
    success: true,
    message: "Comment added successfully",
    gameficationComment,
  });
});

//@desc   Get Comment On Gamefication
//@route  GET /api/v1/gamefication/getComment
//@access protected/user
exports.getAllGameficationComments = asyncHandler(async (req, res, next) => {
  const comments = await GameficationComment.find().populate({
    path: "user",
    select: "name email profileImg",
  });
  if (!comments) {
    return next(new apiError("There is no comments", 404));
  }
  res.status(200).json({
    success: true,
    comments,
  });
});

//@desc     Accept request for free ticket
//@route    PUT /api/v1/gamefication/acceptRequestForFreeTicket/:id
//@access   private/admin
exports.acceptRequestForFreeTicket = asyncHandler(async (req, res, next) => {
  const request = await RequestFreeTicket.findById(req.params.id);
  if (!request) {
    return next(new apiError("Request not found", 404));
  }
  if (request.status === "accepted") {
    return next(new apiError("Request already accepted", 400));
  }
  if (!request.events.includes(req.body.eventId)) {
    return next(new apiError("This event not in the request", 400));
  }
  const acceptRequest = await RequestFreeTicket.findByIdAndUpdate(
    req.params.id,
    {
      status: "accepted",
    },
    {
      new: true,
    }
  );
  const event = await Event.findById(req.body.eventId);
  const message = `Hi ${request.userInformation.name},
\n Congratulations! You have won a free ticket with us.
\n We have accepted your request for the event called "${event.eventName}".
\n Best regards, 
\n The ${process.env.EMAIL_FROM} Team`;
  try {
    await sendEmail({
      email: request.userInformation.email,
      subject: `Congratulations, You have won a free ticket with us`,
      message,
    });
  } catch (err) {
    return next(new apiError("There is an error in sending email", 500));
  }

  res.status(200).json({
    success: true,
    message: "Request accepted successfully",
    request: acceptRequest,
  });
});

//@desc    Reject request for free ticket
//@route   PUT /api/v1/gamefication/rejectRequestForFreeTicket/:id
//@access  private/admin
exports.rejectRequestForFreeTicket = asyncHandler(async (req, res, next) => {
  const request = await RequestFreeTicket.findById(req.params.id);
  if (!request) {
    return next(new apiError("Request not found", 404));
  }
  if (request.status === "rejected") {
    return next(new apiError("Request already rejected", 400));
  }
  //   if (!request.events.includes(req.body.eventId)) {
  //     return next(new apiError("This event not in the request", 400));
  //   }

  const rejectRequest = await RequestFreeTicket.findByIdAndUpdate(
    req.params.id,
    {
      status: "rejected",
    },
    {
      new: true,
    }
  );

  const message = `Hi ${request.userInformation.name},
\n We regret to inform you that your request for booking free ticket has been rejected.
\n Please feel free to reach out for more information or to explore other events.
\n Best regards,
\n The ${process.env.EMAIL_FROM} Team`;

  try {
    await sendEmail({
      email: request.userInformation.email,
      subject: `Your request for a free ticket has been rejected`,
      message,
    });
  } catch (err) {
    return next(new apiError("There is an error in sending email", 500));
  }

  res.status(200).json({
    success: true,
    message: "Request rejected successfully",
    request: rejectRequest,
  });
});

//@desc    Get all requests
//@route   GET /api/v1/gamefication/allRequests
//@access  private/admin
exports.getAllRequests = asyncHandler(async (req, res, next) => {
  const requests = await RequestFreeTicket.find().populate({
    path: "events",
    select:
      "eventName eventImage eventDate eventStartTime eventEndTime eventLocation eventAddress numberOfGoingUsers eventPrice",
  });
  if (!requests) {
    return next(new apiError("There is no requests", 404));
  }
  // add promises
  const dssdsdsf = requests.map((request) => {
    const transformedEvents = request.events.map((event) => {
      return {
        eventName: event.eventName,
        eventImage: event.eventImage,
        eventDate: event.eventDate,
        eventStartTime: event.eventStartTime,
        eventEndTime: event.eventEndTime,
        eventLocation: event.eventLocation,
        eventAddress: event.eventAddress,
        numberOfGoingUsers: event.numberOfGoingUsers,
        eventPrice: event.eventPrice,
      };
    });
    return {
      _id: request._id,
      userInformation: request.userInformation,
      status: request.status,
      events: transformedEvents,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  });
  res.status(200).json({
    success: true,
    requests: dssdsdsf,
  });
});

//@desc    Get specific request
//@route   GET /api/v1/gamefication/request/:id
//@access  private/admin
exports.getRequest = asyncHandler(async (req, res, next) => {
  const request = await RequestFreeTicket.findById(req.params.id).populate({
    path: "events",
    select:
      "eventName eventImage eventDate eventStartTime eventEndTime eventLocation eventAddress numberOfGoingUsers eventPrice",
  });
  if (!request) {
    return next(new apiError("Request not found", 404));
  }
  const reqs = request.events.map((event) => {
    return {
      eventName: event.eventName,
      eventImage: event.eventImage,
      eventDate: event.eventDate,
      eventStartTime: event.eventStartTime,
      eventEndTime: event.eventEndTime,
      eventLocation: event.eventLocation,
      eventAddress: event.eventAddress,
      numberOfGoingUsers: event.numberOfGoingUsers,
      eventPrice: event.eventPrice,
    };
  });
  res.status(200).json({
    success: true,
    request: {
      _id: request._id,
      userInformation: request.userInformation,
      status: request.status,
      events: reqs,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    },
  });
});

//@desc    Delete request
//@route   DELETE /api/v1/gamefication/request/:id
//@access  private/admin
exports.deleteRequest = asyncHandler(async (req, res, next) => {
  const request = await RequestFreeTicket.findByIdAndDelete(req.params.id);
  if (!request) {
    return next(new apiError("Request not found", 404));
  }
  res.status(204).json({
    success: true,
    message: "Request deleted successfully",
  });
});
