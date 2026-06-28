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
