import User from "./User.model.js";
import Event from "./Event.model.js";
import Registration from "./Registration.model.js";
import Message from "./Message.model.js";
import RoleChangeRequest from "./RoleChangeRequest.model.js";

Registration.belongsTo(User, { foreignKey: "studentId", as: "student" });
Registration.belongsTo(Event, { foreignKey: "eventId", as: "event" });
Event.hasMany(Registration, { foreignKey: "eventId", as: "registrations" });
User.hasMany(Registration, { foreignKey: "studentId", as: "registrations" });

Event.belongsTo(User, { foreignKey: "organiserId", as: "organiser" });
User.hasMany(Event, { foreignKey: "organiserId", as: "events" });

Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });
Message.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });

RoleChangeRequest.belongsTo(User, { foreignKey: "studentId", as: "student" });
RoleChangeRequest.belongsTo(User, { foreignKey: "reviewedBy", as: "reviewer" });

import Organisation from "./Organisation.model.js";
import OrganisationMember from "./OrganisationMember.model.js";

Organisation.belongsTo(User, { foreignKey: "creatorId", as: "creator" });
User.hasMany(Organisation, { foreignKey: "creatorId", as: "createdOrganisations" });

OrganisationMember.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation" });
Organisation.hasMany(OrganisationMember, { foreignKey: "organisationId", as: "memberships" });

OrganisationMember.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(OrganisationMember, { foreignKey: "userId", as: "organisationMemberships" });

import Club from "./Club.model.js";
import ClubMember from "./ClubMember.model.js";
import ClubActivity from "./ClubActivity.model.js";

Club.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation" });
Organisation.hasMany(Club, { foreignKey: "organisationId", as: "clubs" });

Club.belongsTo(User, { foreignKey: "creatorId", as: "creator" });
User.hasMany(Club, { foreignKey: "creatorId", as: "createdClubs" });

ClubMember.belongsTo(Club, { foreignKey: "clubId", as: "club" });
Club.hasMany(ClubMember, { foreignKey: "clubId", as: "memberships" });

ClubMember.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(ClubMember, { foreignKey: "userId", as: "clubMemberships" });

ClubActivity.belongsTo(Club, { foreignKey: "clubId", as: "club" });
Club.hasMany(ClubActivity, { foreignKey: "clubId", as: "activities" });

ClubActivity.belongsTo(User, { foreignKey: "creatorId", as: "creator" });
User.hasMany(ClubActivity, { foreignKey: "creatorId", as: "createdClubActivities" });
