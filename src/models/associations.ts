import User from "./User.model.js";
import Event from "./Event.model.js";
import Registration from "./Registration.model.js";

Registration.belongsTo(User, { foreignKey: "studentId", as: "student" });
Registration.belongsTo(Event, { foreignKey: "eventId", as: "event" });
Event.hasMany(Registration, { foreignKey: "eventId", as: "registrations" });
User.hasMany(Registration, { foreignKey: "studentId", as: "registrations" });
