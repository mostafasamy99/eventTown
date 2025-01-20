const mongoose = require("mongoose");

const OrganizerSchema = new mongoose.Schema(
  {
    organizerName: {
      type: String,
      required: true,
      trim: true,
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    organizationField: {
      type: String,
      trim: true,
    },
    organizationWebsite: {
      type: String,
      required: true,
      trim: true,
    },
    organizationPhoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    organizationEmail: {
      type: String,
      required: true,
      trim: true,
    },
    advice: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);
// Middleware to sort by `updatedAt` before any find query
OrganizerSchema.pre(/^find/, function (next) {
  this.sort({ updatedAt: -1 }); // Sort by `updatedAt` in descending order
  next();
});
module.exports = mongoose.model("Organizer", OrganizerSchema);
