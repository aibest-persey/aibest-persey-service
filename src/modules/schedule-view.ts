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

const pad2 = (value: number): string => String(value).padStart(2, "0");

export const formatTimeRange = (start: Date, end: Date): string => {
  const formatTime = (date: Date): string => {
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return `${formatTime(start)} – ${formatTime(end)}`;
};

export const classifyItemKind = (title: string): "class" | "event" => {
  const normalized = title.toLowerCase();
  return normalized.includes("event") || normalized.includes("open house") || normalized.includes("open") ? "event" : "class";
};

export const getMonthCalendar = (selectedDate: Date, today: Date): ScheduleCalendarDay[] => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const daysInMonth = lastDay.getDate();
  const firstWeekday = firstDay.getDay();
  const calendarDays: ScheduleCalendarDay[] = [];

  const normalize = (date: Date): string => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

  const selectedKey = normalize(selectedDate);
  const todayKey = normalize(today);

  for (let offset = firstWeekday; offset > 0; offset -= 1) {
    const date = new Date(year, month, 1 - offset);
    calendarDays.push({
      date,
      dateKey: normalize(date),
      dayNumber: date.getDate(),
      isCurrentMonth: false,
      isToday: normalize(date) === todayKey,
      isSelected: normalize(date) === selectedKey,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    calendarDays.push({
      date,
      dateKey: normalize(date),
      dayNumber: day,
      isCurrentMonth: true,
      isToday: normalize(date) === todayKey,
      isSelected: normalize(date) === selectedKey,
    });
  }

  const remaining = 42 - calendarDays.length;
  for (let offset = 1; offset <= remaining; offset += 1) {
    const date = new Date(year, month + 1, offset);
    calendarDays.push({
      date,
      dateKey: normalize(date),
      dayNumber: date.getDate(),
      isCurrentMonth: false,
      isToday: normalize(date) === todayKey,
      isSelected: normalize(date) === selectedKey,
    });
  }

  return calendarDays;
};

export const buildScheduleResponse = ({
  selectedDate,
  today,
  items,
}: {
  selectedDate: Date;
  today: Date;
  items: ScheduleItemInput[];
}): ScheduleResponse => ({
  selectedDate: selectedDate.toISOString(),
  today: today.toISOString(),
  days: getMonthCalendar(selectedDate, today),
  items: items.map((item) => ({
    id: item.id,
    title: item.title,
    timeRange: formatTimeRange(item.start, item.end),
    ownerName: item.ownerName,
    detailUrl: item.detailUrl,
    ticketCode: item.ticketCode,
    kind: classifyItemKind(item.title),
  })),
});
