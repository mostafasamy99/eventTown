const Organizer = require("../models/organizerModel");

const factory = require("./handllerFactory");

//@desc get All Organizers
//@route GET /api/v1/organizers
//@access public
exports.getAllOrganizers = factory.getAll(Organizer, "Organizer");

//@desc get specific Organizer by id
//@route GET /api/v1/organizers/:id
//@access public
exports.getOrganizer = factory.getOne(Organizer);


//@desc create Organizer
//@route POST /api/v1/organizers
//@access protect
exports.createOrganizer = factory.createOne(Organizer);

//@desc update Organizer
//@route PUT /api/v1/organizers
//@access protect
exports.updateOrganizer = factory.updateOne(Organizer);

//@desc delete Organizer
//@route Delete /api/v1/organizers
//@access protect
exports.deleteOrganizer = factory.deleteOne(Organizer);
