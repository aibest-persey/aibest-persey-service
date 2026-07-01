export type EventVisibility = "public" | "org-only" | "club";
export type EventOwnerScope = "public" | "organisation" | "club";
export interface EventFormContext {
    role: "student" | "organiser" | "admin";
    hasOrganisationMembership?: boolean;
    hasClubMembership?: boolean;
}
export interface EventFormPayload {
    title?: unknown;
    description?: unknown;
    coverImage?: unknown;
    startAt?: unknown;
    endAt?: unknown;
    start?: unknown;
    end?: unknown;
    capacity?: unknown;
    visibility?: unknown;
    ownerScope?: unknown;
    scope?: unknown;
}
export interface EventFormOptions {
    allowedVisibilityOptions: EventVisibility[];
    allowedOwnerScopes: EventOwnerScope[];
}
export type EventFormValidationResult = {
    ok: true;
    values: EventFormValueSet;
} | {
    ok: false;
    errors: string[];
};
export interface EventFormValueSet {
    title: string;
    description: string | null;
    coverImage: string | null;
    startAt: Date;
    endAt: Date;
    capacity: number | null;
    visibility: EventVisibility;
    ownerScope: EventOwnerScope;
}
export declare function getAllowedEventFormOptions(context: EventFormContext): EventFormOptions;
export declare function validateEventFormPayload(payload: EventFormPayload, context: EventFormContext): EventFormValidationResult;
//# sourceMappingURL=event-form-utils.d.ts.map