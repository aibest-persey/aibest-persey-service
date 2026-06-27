export type DomainEventType =
  | "registration.confirmed"
  | "registration.waitlisted"
  | "registration.promoted"
  | "registration.cancelled"
  | "event.cancelled";

// Student successfully registered — confirmed seat
export interface RegistrationConfirmedPayload {
  eventId: string;
  eventTitle: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  registrationId: string;
}

// Student placed on waitlist — no confirmed seat available at registration time
export interface RegistrationWaitlistedPayload {
  eventId: string;
  eventTitle: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  registrationId: string;
  waitlistPosition: number;
}

// Waitlisted student promoted to confirmed — triggered by another student's cancellation
export interface RegistrationPromotedPayload {
  eventId: string;
  eventTitle: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  registrationId: string;
}

// Student cancelled their own registration (confirmed or waitlisted)
export interface RegistrationCancelledPayload {
  eventId: string;
  eventTitle: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  registrationId: string;
}

// Organiser cancelled the event — consumers query registrations by eventId to notify attendees
export interface EventCancelledPayload {
  eventId: string;
  eventTitle: string;
  organiserId: string;
}

export type DomainEventPayloadMap = {
  "registration.confirmed": RegistrationConfirmedPayload;
  "registration.waitlisted": RegistrationWaitlistedPayload;
  "registration.promoted": RegistrationPromotedPayload;
  "registration.cancelled": RegistrationCancelledPayload;
  "event.cancelled": EventCancelledPayload;
};
