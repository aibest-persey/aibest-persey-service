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
