const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const gameficationCommentSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    img: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
const setProfileImageURL = (doc) => {
  //return image base url + iamge name
  if (doc.img) {
    const URL = `${process.env.BASE_URL}/gamefication/comments/${doc.img}`;
    doc.img = URL;
  }
};
//after initializ the doc in db
// check if the document contains image
// it work with findOne,findAll,update
gameficationCommentSchema.post("init", (doc) => {
  setProfileImageURL(doc);
});
// it work with create
gameficationCommentSchema.post("save", (doc) => {
  setProfileImageURL(doc);
});
module.exports = mongoose.model(
  "GameficationComment",
  gameficationCommentSchema
);
