const mongoose = require("mongoose");

const gameficationPointSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const GameficationPoint = mongoose.model(
  "GameficationPoint",
  gameficationPointSchema
);

module.exports = GameficationPoint;
