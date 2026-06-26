export type DomainEventType =
  | "registration.confirmed"
  | "registration.waitlisted"
  | "registration.promoted"
  | "registration.cancelled";

export interface RegistrationConfirmedPayload {
  eventId: string;
  eventTitle: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  registrationId: string;
}

export interface RegistrationWaitlistedPayload {
  eventId: string;
  eventTitle: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  registrationId: string;
  waitlistPosition: number;
}

export interface RegistrationPromotedPayload {
  eventId: string;
  eventTitle: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  registrationId: string;
}

export interface RegistrationCancelledPayload {
  eventId: string;
  eventTitle: string;
  studentId: string;
  registrationId: string;
}

export type DomainEventPayloadMap = {
  "registration.confirmed": RegistrationConfirmedPayload;
  "registration.waitlisted": RegistrationWaitlistedPayload;
  "registration.promoted": RegistrationPromotedPayload;
  "registration.cancelled": RegistrationCancelledPayload;
};
