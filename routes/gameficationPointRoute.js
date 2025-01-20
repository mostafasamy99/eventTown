const {
  addPoints,
  requestFreeTicket,
  getMyPoints,
  getMyRequests,
  addCommentOnGamefication,
  getAllGameficationComments,
  acceptRequestForFreeTicket,
  rejectRequestForFreeTicket,
  getAllRequests,
  getRequest,
  deleteRequest,
  uploadGameficationCommentImage,
  resizeImage,
} = require("../services/gameficationPointService");

const router = require("express").Router();
const authServices = require("../services/authServices");
const {
  addPointsValidator,
  requestFreeTicketValidator,
} = require("../utils/validators/gameficationPointValidators");

router.post("/addPoints", authServices.protect, addPointsValidator, addPoints);
router.get("/myPoints", authServices.protect, getMyPoints);
router.get("/myHistory", authServices.protect, getMyRequests);

router.post(
  "/requestFreeTicket",
  authServices.protect,
  requestFreeTicketValidator,
  requestFreeTicket
);

router.post(
  "/addComment",
  uploadGameficationCommentImage,
  resizeImage,
  authServices.protect,
  addCommentOnGamefication
);
router.get("/getComments", authServices.protect, getAllGameficationComments);

router.put(
  "/acceptRequestForFreeTicket/:id",
  authServices.protect,
  authServices.allowTo("admin"),
  acceptRequestForFreeTicket
);
router.put(
  "/rejectRequestForFreeTicket/:id",
  authServices.protect,
  authServices.allowTo("admin"),
  rejectRequestForFreeTicket
);

router.get(
  "/allRequests",
  authServices.protect,
  authServices.allowTo("admin"),
  getAllRequests
);

router.get(
  "/request/:id",
  authServices.protect,
  authServices.allowTo("admin"),
  getRequest
);

router.delete(
  "/request/:id",
  authServices.protect,
  authServices.allowTo("admin"),
  deleteRequest
);

module.exports = router;
