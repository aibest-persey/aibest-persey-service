import User from "./User.model.js";
import Event from "./Event.model.js";
import Registration from "./Registration.model.js";
import Message from "./Message.model.js";
import RoleChangeRequest from "./RoleChangeRequest.model.js";
import Organisation from "./Organisation.model.js";
import OrganisationMember from "./OrganisationMember.model.js";
import Club from "./Club.model.js";
import ClubMember from "./ClubMember.model.js";
import News from "./News.model.js";
import OrganisationJoinRequest from "./OrganisationJoinRequest.model.js";
import OAuthAccount from "./OAuthAccount.model.js";
import Post from "./Post.model.js";
import Notification from "./Notification.model.js";

Registration.belongsTo(User, { foreignKey: "studentId", as: "student" });
Registration.belongsTo(Event, { foreignKey: "eventId", as: "event" });
Event.hasMany(Registration, { foreignKey: "eventId", as: "registrations" });
User.hasMany(Registration, { foreignKey: "studentId", as: "registrations" });

Event.belongsTo(User, { foreignKey: "organiserId", as: "organiser" });
User.hasMany(Event, { foreignKey: "organiserId", as: "events" });
Event.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation" });
Organisation.hasMany(Event, { foreignKey: "organisationId", as: "events" });

Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });
Message.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });

RoleChangeRequest.belongsTo(User, { foreignKey: "studentId", as: "student" });
RoleChangeRequest.belongsTo(User, { foreignKey: "reviewedBy", as: "reviewer" });

Organisation.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
User.hasMany(Organisation, { foreignKey: "createdBy", as: "createdOrganisations" });

OrganisationMember.belongsTo(User, { foreignKey: "userId", as: "user" });
OrganisationMember.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation" });
Organisation.hasMany(OrganisationMember, { foreignKey: "organisationId", as: "members" });
User.hasMany(OrganisationMember, { foreignKey: "userId", as: "organisationMemberships" });

Club.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
User.hasMany(Club, { foreignKey: "createdBy", as: "createdClubs" });
Club.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation" });
Organisation.hasMany(Club, { foreignKey: "organisationId", as: "clubs" });

ClubMember.belongsTo(User, { foreignKey: "userId", as: "user" });
ClubMember.belongsTo(Club, { foreignKey: "clubId", as: "club" });
Club.hasMany(ClubMember, { foreignKey: "clubId", as: "members" });
User.hasMany(ClubMember, { foreignKey: "userId", as: "clubMemberships" });

News.belongsTo(User, { foreignKey: "createdBy", as: "author" });
User.hasMany(News, { foreignKey: "createdBy", as: "news" });
News.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation" });
Organisation.hasMany(News, { foreignKey: "organisationId", as: "news" });
News.belongsTo(Club, { foreignKey: "clubId", as: "club" });
Club.hasMany(News, { foreignKey: "clubId", as: "news" });

OrganisationJoinRequest.belongsTo(User, { foreignKey: "studentId", as: "student" });
OrganisationJoinRequest.belongsTo(User, { foreignKey: "reviewedBy", as: "reviewer" });
OrganisationJoinRequest.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation" });
Organisation.hasMany(OrganisationJoinRequest, { foreignKey: "organisationId", as: "joinRequests" });
User.hasMany(OrganisationJoinRequest, { foreignKey: "studentId", as: "organisationJoinRequests" });

OAuthAccount.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(OAuthAccount, { foreignKey: "userId", as: "oauthAccounts" });

Post.belongsTo(User, { foreignKey: "authorId", as: "author" });
User.hasMany(Post, { foreignKey: "authorId", as: "posts" });
Post.belongsTo(Club, { foreignKey: "clubId", as: "club" });
Club.hasMany(Post, { foreignKey: "clubId", as: "posts" });

Event.belongsTo(Club, { foreignKey: "clubId", as: "club" });
Club.hasMany(Event, { foreignKey: "clubId", as: "events" });

Notification.belongsTo(User, { foreignKey: "userId", as: "recipient" });
User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
