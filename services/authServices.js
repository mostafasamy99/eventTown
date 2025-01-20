const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy; // Import FacebookStrategy

const ApiError = require('../utils/apiError');
const UserAuthorization = require('../utils/UserAuthorization');
const sendEmail = require('../utils/sendEmail');
const createToken = require('../utils/createToken');

const User = require('../models/userModel');
const { subscribeToTopic, unsubscribeFromTopic } = require('./fcmService');

exports.setRestrictionOnSignUp = asyncHandler(async (req, res, next) => {
  const restrictedFields = [
    'slug',
    'isOAuthUser',
    'emailVerifyCode',
    'emailVerifyExpires',
    'emailVerified',
    'passwordChangedAt',
    'passwordResetCode',
    'passwordResetExpires',
    'passwordResetVerified',
    'role',
  ];

  restrictedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      delete req.body[field];
    }
  });
  next();
});

// @desc    User Register,login with Google
// @route   POST /api/v1/auth/google
// @access  Public
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: process.env.GOOGLE_CALLBACK_URL,
//       passReqToCallback: true,
//     },
//     asyncHandler(async (req, accessToken, refreshToken, profile, done) => {
//       // Find a user by google.id or email in the database
//       let existingUser = await User.findOne({
//         $or: [{ "google.id": profile.id }, { email: profile.emails[0].value }],
//       });

//       console.log("profile", profile);

//       if (existingUser) {
//         // Check if the user has logged in with Google before
//         if (!existingUser.google || !existingUser.google.id) {
//           // The user exists by email but hasn't logged in with Google before, so update the record
//           await User.updateOne(
//             { _id: existingUser._id }, // filter
//             {
//               // update
//               $set: {
//                 "google.id": profile.id,
//                 "google.email": profile.emails[0].value,
//                 isOAuthUser: true,
//                 emailVerified: true,
//               },
//             }
//           );
//           // After update, it's a good idea to refresh the existingUser object if you plan to use it right after
//           existingUser = await User.findById(existingUser._id);
//         }
//         // Generate a JWT for the (possibly updated) existing user
//         const token = createToken(existingUser._id);
//         return done(null, { user: existingUser, token }); // Include token in the user object
//       }
//       // No user exists by Google ID or email, create a new user
//       const newUser = await User.create({
//         name: profile.displayName,
//         email: profile.emails[0].value,
//         google: {
//           id: profile.id,
//           email: profile.emails[0].value,
//         },
//         isOAuthUser: true,
//         emailVerified: true,
//       });
//       const token = createToken(newUser._id);
//       done(null, { user: newUser, token }); // Include token in the user object
//     })
//   )
// );

// @desc    User Register,login with facebook
// @route   POST /api/v1/auth/facebook
// @access  Public
// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: process.env.FACEBOOK_APP_ID,
//       clientSecret: process.env.FACEBOOK_APP_SECRET,
//       callbackURL: process.env.FACEBOOK_CALLBACK_URL,
//       profileFields: ["id", "displayName", "emails"],
//       passReqToCallback: true,
//     },
//     asyncHandler(async (req, accessToken, refreshToken, profile, done) => {
//       // Facebook authentication logic
//       let existingUser = await User.findOne({
//         $or: [
//           { "facebook.id": profile.id },
//           { email: profile.emails[0].value },
//         ],
//       });

//       if (existingUser) {
//         if (!existingUser.facebook || !existingUser.facebook.id) {
//           await User.updateOne(
//             { _id: existingUser._id },
//             {
//               $set: {
//                 "facebook.id": profile.id,
//                 "facebook.email": profile.emails[0].value,
//                 isOAuthUser: true,
//                 emailVerified: true,
//               },
//             }
//           );
//           existingUser = await User.findById(existingUser._id);
//         }
//         const token = createToken(existingUser._id);
//         return done(null, { user: existingUser, token });
//       }

//       const newUser = await User.create({
//         name: profile.displayName,
//         email: profile.emails[0].value,
//         facebook: {
//           id: profile.id,
//           email: profile.emails[0].value,
//         },
//         isOAuthUser: true,
//         emailVerified: true,
//       });
//       const token = createToken(newUser._id);
//       done(null, { user: newUser, token });
//     })
//   )
// );

// @desc    User Register
// @route   POST /api/v1/auth/signup
// @access  Public
exports.signup = asyncHandler(async (req, res, next) => {
  // Generate hash code random 6 digits.
  const emailVerifyCode = Math.floor(100000 + Math.random() * 900000).toString();

  const hashEmailVerifyCode = crypto.createHash('sha256').update(emailVerifyCode).digest('hex');

  req.body.emailVerifyCode = hashEmailVerifyCode;
  req.body.emailVerifyExpires = Date.now() + 10 * 60 * 1000;
  req.body.emailVerified = false;

  const message = `Hi ${req.body.name},
   \n We received a request to Verify the email on your ${process.env.EMAIL_FROM} Account .
    \n Verification Code: ${emailVerifyCode} \n Enter this code to verify your email.
    \n Thanks for helping us keep your account secure.
     \n  The ${process.env.EMAIL_FROM} Team`;

  // Send code via email
  try {
    await sendEmail({
      email: req.body.email,
      subject: 'Your Verification Code (Valid For 10 min)',
      message,
    });
  } catch (err) {
    req.body.emailVerifyCode = undefined;
    req.body.emailVerifyExpires = undefined;
    req.body.emailVerified = undefined;

    return next(new ApiError('There is an error in sending email', 500));
  }

  // create user
  const user = await User.create(req.body);
  console.log('user', user);
  if (user.fcmToken) {
    // subscribe user to topic
    if (user.interests.length > 0) {
      user.interests.forEach(async interest => {
        await subscribeToTopic(user.fcmToken, interest._id.toString());
      });
    }
  }
  res.status(201).json({ status: 'Success', data: user });
});

// Resend verify code
exports.resendVerifyCode = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
    emailVerified: false,
  });
  if (!user) {
    return next(new ApiError('User not found or already verified', 404));
  }
  // Generate hash code random 6 digits.
  const emailVerifyCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashEmailVerifyCode = crypto.createHash('sha256').update(emailVerifyCode).digest('hex');
  const emailVerifyExpires = Date.now() + 10 * 60 * 1000;

  // Update the user directly in the database without using .save()
  await User.updateOne(
    { _id: user._id },
    {
      emailVerifyCode: hashEmailVerifyCode,
      emailVerifyExpires,
      emailVerified: false,
    }
  );

  const message = `Hi ${user.name},
   \n We received a request to Verify the email on your ${process.env.EMAIL_FROM} Account .
    \n Verification Code: ${emailVerifyCode} \n Enter this code to verify your email.
    \n Thanks for helping us keep your account secure.
     \n  The ${process.env.EMAIL_FROM} Team`;
  // Send code via email
  try {
    await sendEmail({
      email: req.body.email,
      subject: 'Your Verification Code (Valid For 10 min)',
      message,
    });
  } catch (err) {
    return next(new ApiError('There is an error in sending email', 500));
  }
  res.status(200).json({ status: 'Success', message: 'Verification Code send via email ' });
});

// @desc    User verify email
// @route   POST /api/v1/auth/verifyEmailCode
// @access  Public
exports.verifyEmailCode = asyncHandler(async (req, res, next) => {
  // 1- Get user based on reset code
  const hashEmailVerifyCode = crypto.createHash('sha256').update(req.body.emailVerifyCode.toString()).digest('hex');

  const user = await User.findOne({
    emailVerifyCode: hashEmailVerifyCode,
    emailVerifyExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError('Email Verify Code invalid or expired', 422));
  }

  // 2- Reset code is valid, update user without using .save()
  await User.updateOne(
    { _id: user._id },
    {
      emailVerified: true,
      emailVerifyCode: undefined,
      emailVerifyExpires: undefined,
    }
  );

  // Generate token
  const token = createToken(user._id);

  res.status(200).json({
    status: 'success',
    data: user,
    token,
  });
});

// @desc    User Login
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    return next(new ApiError('Incorrect email or password', 401));
  }
  if (!user.emailVerified) {
    return next(new ApiError('Email not verified, please verify your email', 401));
  }
  const token = createToken(user._id);
  // if fcmToken is provided, update it in the database
  if (req.body.fcmToken) {
    await User.updateOne({ _id: user._id }, { fcmToken: req.body.fcmToken });
    console.log('fcmToken updated');
  }
  if (req.body.fcmToken !== user.fcmToken) {
    // subscribe user to topic
    if (user.interests.length > 0) {
      user.interests.forEach(async interest => {
        console.log('interest', interest);
        await subscribeToTopic(user.fcmToken, interest._id.toString());
      });
      // unsubscribe user from old topic
      if (user.interests.length > 0) {
        user.interests.forEach(async interest => {
          await unsubscribeFromTopic(user.fcmToken, interest._id.toString());
        });
      }
    }
  }
  res.status(200).json({ data: user, token });
});

// @desc  make sure the user is logged in
exports.protect = asyncHandler(async (req, res, next) => {
  const userAuthorization = new UserAuthorization();

  const token = userAuthorization.getToken(req.headers.authorization);
  const decoded = userAuthorization.tokenVerifcation(token);
  const currentUser = await userAuthorization.checkCurrentUserExist(decoded);
  userAuthorization.checkUserChangeHisPasswordAfterTokenCreated(currentUser, decoded);

  req.user = currentUser;
  next();
});

//@desc  Authorization (User Permissions)
exports.allowTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError('you are not allowed to access this router', 403));
    }
    next();
  });

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ApiError(`No user found for this email: ${req.body.email}`, 404));
  }

  // 2) If user exists, generate hash reset random 6 digits.
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashResetCode = crypto.createHash('sha256').update(resetCode).digest('hex');

  const passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // Update the user directly in the database without using .save()
  await User.updateOne(
    { _id: user._id },
    {
      passwordResetCode: hashResetCode,
      passwordResetExpires,
      passwordResetVerified: false,
    }
  );

  const message = `Hi ${user.name},
  \n We received a request to reset the password on your ${process.env.EMAIL_FROM} Account.
  \n Reset Code: ${resetCode}
  \n Enter this code to complete the reset password.
  \n Thanks for helping us keep your account secure.
  \n The ${process.env.EMAIL_FROM} Team`;

  // 3) Send reset code via email
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Password Reset Code (Valid For 10 min)',
      message,
    });
  } catch (err) {
    // Rollback changes if email sending fails
    await User.updateOne(
      { _id: user._id },
      {
        passwordResetCode: undefined,
        passwordResetExpires: undefined,
        passwordResetVerified: undefined,
      }
    );

    return next(new ApiError('There was an error sending the email', 500));
  }

  res.status(200).json({ status: 'Success', message: 'Reset Code sent to email' });
});
// @desc    verify Password Reset Code
// @route   POST /api/v1/auth/verifyResetCode
// @access  Public
exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
  // 1- Get user based on reset code
  const hashResetCode = crypto.createHash('sha256').update(req.body.resetCode.toString()).digest('hex');

  const user = await User.findOne({
    passwordResetCode: hashResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError('Reset Code invalid or expired', 422));
  }

  // 2) Reset code is valid, update user without using .save()
  await User.updateOne(
    { _id: user._id },
    {
      passwordResetVerified: true,
    }
  );

  res.status(200).json({
    status: 'success',
  });
});

// @desc    Reset Password
// @route   PUT /api/v1/auth/resetPassword
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ApiError(`No user found for this email: ${req.body.email}`, 404));
  }

  if (!user.passwordResetVerified) {
    return next(new ApiError('Reset code not verified', 400));
  }

  // Hash the new password before updating
  const hashedPassword = await bcrypt.hash(req.body.newPassword, 12);

  // Update the user with the hashed password using `findByIdAndUpdate`
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      password: hashedPassword,
      passwordResetCode: undefined,
      passwordResetExpires: undefined,
      passwordResetVerified: undefined,
    },
    { new: true } // This returns the updated user document
  );

  // If the password is successfully updated, generate a token
  if (updatedUser) {
    const token = createToken(user._id);
    res.status(200).json({ token });
  } else {
    return next(new ApiError('Password update failed', 500));
  }
});
