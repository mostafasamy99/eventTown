const express = require("express");
const {
  createOrganizerValidator,
  getOrganizerValidator,
  updateOrganizerValidator,
  deleteOrganizerValidator,
} = require("../utils/validators/organizerValidator");
const {
  getOrganizer,
  updateOrganizer,
  deleteOrganizer,
  createOrganizer,
  getAllOrganizers,
} = require("../services/organizerServices");

const router = express.Router();

const authServices = require("../services/authServices");

router.post(
  "/",
  authServices.protect,
  createOrganizerValidator,
  createOrganizer
);

router.get(
  "/",
  authServices.protect,
  authServices.allowTo("admin"),
  getAllOrganizers
);

router.get(
  "/:id",
  authServices.protect,
  authServices.allowTo("admin"),
  getOrganizerValidator,
  getOrganizer
);

router.put(
  "/:id",
  authServices.protect,
  authServices.allowTo("admin"),
  updateOrganizerValidator,
  updateOrganizer
);
router.delete(
  "/:id",
  authServices.protect,
  authServices.allowTo("admin"),
  deleteOrganizerValidator,
  deleteOrganizer
);

module.exports = router;
