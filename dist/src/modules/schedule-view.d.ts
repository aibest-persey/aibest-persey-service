export interface ScheduleItemInput {
    id: string;
    title: string;
    start: Date;
    end: Date;
    ownerName: string | null;
    detailUrl: string;
    ticketCode: string | null;
}
export interface ScheduleCalendarDay {
    date: Date;
    dateKey: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
}
export interface ScheduleAgendaItem {
    id: string;
    title: string;
    timeRange: string;
    ownerName: string | null;
    detailUrl: string;
    ticketCode: string | null;
    kind: "class" | "event";
}
export interface ScheduleResponse {
    selectedDate: string;
    today: string;
    days: ScheduleCalendarDay[];
    items: ScheduleAgendaItem[];
}
export declare const formatTimeRange: (start: Date, end: Date) => string;
export declare const classifyItemKind: (title: string) => "class" | "event";
export declare const getMonthCalendar: (selectedDate: Date, today: Date) => ScheduleCalendarDay[];
export declare const buildScheduleResponse: ({ selectedDate, today, items, }: {
    selectedDate: Date;
    today: Date;
    items: ScheduleItemInput[];
}) => ScheduleResponse;
//# sourceMappingURL=schedule-view.d.ts.map