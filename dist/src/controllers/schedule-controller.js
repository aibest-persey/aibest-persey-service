import { buildScheduleResponse } from "../modules/schedule-view.js";
const makeItems = (selectedDate) => {
    const iso = selectedDate.toISOString().slice(0, 10);
    const start = new Date(`${iso}T09:00:00Z`);
    const end = new Date(`${iso}T10:00:00Z`);
    const eventStart = new Date(`${iso}T13:30:00Z`);
    const eventEnd = new Date(`${iso}T15:00:00Z`);
    return [
        {
            id: `class-${iso}`,
            title: "Morning Yoga Class",
            start,
            end,
            ownerName: "Mina Petrova",
            detailUrl: `/schedule/class-${iso}`,
            ticketCode: null,
        },
        {
            id: `event-${iso}`,
            title: "Community Open House",
            start: eventStart,
            end: eventEnd,
            ownerName: "Persey Team",
            detailUrl: `/schedule/event-${iso}`,
            ticketCode: "TICKET-1",
        },
    ];
};
export const getSchedule = async (req, res) => {
    try {
        const requestedDate = req.query.date ? new Date(String(req.query.date)) : new Date();
        if (Number.isNaN(requestedDate.getTime())) {
            res.status(400).json({ message: "Invalid date query parameter." });
            return;
        }
        const today = new Date();
        const response = buildScheduleResponse({
            selectedDate: requestedDate,
            today,
            items: makeItems(requestedDate),
        });
        res.json(response);
    }
    catch (error) {
        console.error("Get Schedule Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
//# sourceMappingURL=schedule-controller.js.map