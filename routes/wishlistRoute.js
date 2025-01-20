const express = require("express");

const authServices = require("../services/authServices");
const {
  getLoggedUserWishlist,
  addEventToWishlist,
  removeEventFromWishlist,
} = require("../services/wishlistService");
const {
  addEventToWishlistValidator,
  removeEventFromWishlistValidator,
} = require("../utils/validators/wishlistValidator");

const router = express.Router();

router.use(authServices.protect, authServices.allowTo("admin", "user"));

router
  .route("/")
  .get(getLoggedUserWishlist)
  .post(addEventToWishlistValidator, addEventToWishlist);
router.delete(
  "/:eventId",
  removeEventFromWishlistValidator,
  removeEventFromWishlist
);

module.exports = router;
