import assert from "node:assert/strict";
import { buildScheduleResponse, classifyItemKind, formatTimeRange, getMonthCalendar } from "../src/modules/schedule-view.js";

const selectedDate = new Date("2026-07-15T12:00:00Z");
const today = new Date("2026-07-01T12:00:00Z");

const calendar = getMonthCalendar(selectedDate, today);
assert(calendar.some((day) => day.isToday && day.dateKey === "2026-07-01"), "calendar should highlight today");
assert(calendar.some((day) => day.isSelected && day.dateKey === "2026-07-15"), "calendar should highlight the selected date");

const response = buildScheduleResponse({
  selectedDate,
  today,
  items: [
    {
      id: "class-1",
      title: "Morning Yoga Class",
      start: new Date("2026-07-15T09:00:00Z"),
      end: new Date("2026-07-15T10:00:00Z"),
      ownerName: "Mina Petrova",
      detailUrl: "/events/class-1",
      ticketCode: null,
    },
    {
      id: "event-1",
      title: "Open House",
      start: new Date("2026-07-15T13:30:00Z"),
      end: new Date("2026-07-15T15:00:00Z"),
      ownerName: "Persey Team",
      detailUrl: "/events/event-1",
      ticketCode: "TICKET-1",
    },
  ],
});

assert.equal(response.items[0].kind, "class", "class items should be classified as class");
assert.equal(response.items[1].kind, "event", "event items should be classified as event");
assert.equal(response.items[0].timeRange, "09:00 – 10:00", "time range should be formatted");
assert.equal(response.items[1].ticketCode, "TICKET-1", "event items should expose a ticket code");
assert.equal(classifyItemKind("Community Workshop"), "class", "workshop should map to class");
assert.equal(formatTimeRange(new Date("2026-07-15T14:00:00Z"), new Date("2026-07-15T16:30:00Z")), "14:00 – 16:30", "time range should format correctly");

console.log("schedule module tests passed");
