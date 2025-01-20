// database
const mongoose = require("mongoose");
//1- create schema
const eventSchema = mongoose.Schema(
  {
    organizerName: {
      type: String,
      trim: true,
      minlength: [3, "Too short organizer name "],
      maxlength: [32, "Too long organizer name"],
    },
    organizationName: {
      type: String,
      minlength: [2, "too short category  organization name "],
      maxlength: [32, "too long category organization name"],
      trim: true,
    },
    organizationPhoneNumber: {
      type: String,
      trim: true,
    },
    organizationEmail: {
      type: String,
      trim: true,
    },
    organizationWebsite: {
      type: String,
    },
    organizerPlan: {
      type: String,
      enum: ["free", "basic", "standard", "premium"],
      default: "free",
    },
    expirePlanDate: {
      type: Date,
    },
    eventName: {
      type: String,
      trim: true,
      minlength: [3, "Too short Event name "],
      maxlength: [32, "Too long event name"],
    },
    eventAddress: {
      type: String,
      trim: true,
    },
    eventCategory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    eventDate: {
      type: Date,
    },
    eventStartTime: {
      type: Date,
    },
    eventEndTime: {
      type: Date,
    },
    eventLocation: {
      type: String,
      trim: true,
      lowercase: true,
    },
    eventPlace: {
      type: String,
      trim: true,
      lowercase: true,
    },
    eventImage: String,
    ticketEventLink: {
      type: String,
    },
    eventPrice: {
      type: Number,
    },
    eventDescription: {
      type: String,
    },
    eventStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    numberOfGoingUsers: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
eventSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "event",
  localField: "_id",
});
eventSchema.pre(/^find/, function (next) {
  this.populate({ path: "eventCategory", select: "title" })
    .populate({
      path: "comments",
      // $match: { eventStatus: "accepted" },
      select: "text -event",
    })
    .sort({ updatedAt: -1 });
  next();
});

const setEventImageURL = (doc) => {
  //return image base url + iamge name
  if (doc.eventImage) {
    if (
      doc.eventImage.includes(process.env.BASE_URL) ||
      doc.eventImage.includes("http")
    ) {
      let editingEventImageURL = doc.eventImage;
      const splittedURL = editingEventImageURL.split("/");
      const imageName = splittedURL.pop();

      const URL = `${process.env.BASE_URL}/events/${imageName}`;
      doc.eventImage = URL;
      return;
    }
    const URL = `${process.env.BASE_URL}/events/${doc.eventImage}`;
    doc.eventImage = URL;
  }
};
//after initializ the doc in db
// check if the document contains image
// it work with findOne,findAll,update
eventSchema.post("init", (doc) => {
  setEventImageURL(doc);
});
// it work with create
eventSchema.post("save", (doc) => {
  setEventImageURL(doc);
});

// Custom toJSON method to include expirePlanDate conditionally
eventSchema.methods.toJSON = function () {
  const obj = this.toObject();
  if (obj.organizerPlan === "free") {
    delete obj.expirePlanDate;
  }
  return obj;
};
//2- create model
const EventModel = mongoose.model("Event", eventSchema);

module.exports = EventModel;
