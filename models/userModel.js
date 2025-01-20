const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Name required'],
      minLength: [3, 'Too short user name'],
    },
    email: {
      type: String,
      required: [true, 'Email Required'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [
        function () {
          return !this.isOAuthUser;
        },
        'Password required',
      ],
      minlength: [8, 'Too short Password'],
    },
    location: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
    },
    phone: String,
    profileImg: String,
    interests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
        maxlength: 50,
      },
    ],
    slug: {
      type: String,
      lowercase: true,
    },
    google: {
      id: String,
      email: String,
    },
    facebook: {
      id: String,
      email: String,
    },
    isOAuthUser: {
      type: Boolean,
      default: false,
    },
    // Email verification when the user register for first time.
    emailVerifyCode: String,
    emailVerifyExpires: Date,
    emailVerified: Boolean,

    // Email verification when user forgot password.
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: ['user', 'organizer', 'admin'],
      default: 'user',
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],
    calendar: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],
    // fcm tokens
    fcmToken: {
      type: String,
      
    },
  },
  { timestamps: true } // This adds `createdAt` and `updatedAt` fields
);
userSchema.pre(/^find/, function (next) {
  this.populate({ path: 'interests', select: 'title' }).sort({ updatedAt: -1 }); // Sort by `updatedAt` in descending order

  next();
});
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.emailVerifyCode;
  delete obj.emailVerifyExpires;
  delete obj.passwordChangedAt;
  delete obj.passwordResetCode;
  delete obj.passwordResetExpires;
  delete obj.password;

  return obj;
};
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});
const setProfileImageURL = doc => {
  //return image base url + iamge name
  if (doc.profileImg) {
    const URL = `${process.env.BASE_URL}/users/${doc.profileImg}`;
    doc.profileImg = URL;
  }
};
//after initializ the doc in db
// check if the document contains image
// it work with findOne,findAll,update
userSchema.post('init', doc => {
  setProfileImageURL(doc);
});
// it work with create
userSchema.post('save', doc => {
  setProfileImageURL(doc);
});









module.exports = mongoose.model('User', userSchema);
