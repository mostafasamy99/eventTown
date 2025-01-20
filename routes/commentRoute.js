const {
  setUserIdToBody,
  createComment,
  //   updateComment,
  getOneComment,
  deleteComment,
  getAllComment,
  createFilterobj,
  setEventIdToBody,
} = require("../services/commentServices");
const {
  createCommentValidator,
  //   updateCommentValidator,
  deleteCommentValidator,
  getOneCommentValidator,
} = require("../utils/validators/commentValidator");

const authService = require("../services/authServices");

const router = require("express").Router({ mergeParams: true });

router.post(
  "/",
  authService.protect,
  setUserIdToBody,
  setEventIdToBody,
  createCommentValidator,
  createComment
);
router.get("/", authService.protect, createFilterobj, getAllComment);
router.get("/:id", authService.protect, getOneCommentValidator, getOneComment);
// router.put(
//   "/:id",
//   authService.protect,
//   setUserIdToBody,
//   updateCommentValidator,
//   updateComment
// );

router.delete(
  "/:id",
  authService.protect,
  authService.allowTo("admin"),
  deleteCommentValidator,
  deleteComment
);

module.exports = router;
