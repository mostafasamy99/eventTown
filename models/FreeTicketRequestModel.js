const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FreeTicketRequestSchema = new Schema(
  {
    loggedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userInformation: {
      name: { type: String, required: [true, "Please provide your name"] },
      email: { type: String, required: [true, "Please provide your email"] },
      phone: {
        type: String,
        required: [true, "Please provide your phone number"],
      },
      address: {
        type: String,
        required: [true, "Please provide your address"],
      },
    },
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

FreeTicketRequestSchema.pre(/^find/, function (next) {
  this.populate({ path: "loggedUser" }).populate({ path: "events" });
  next();
});
module.exports = mongoose.model("FreeTicketRequest", FreeTicketRequestSchema);
