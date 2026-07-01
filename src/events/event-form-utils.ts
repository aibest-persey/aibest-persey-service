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

export type EventFormValidationResult =
  | { ok: true; values: EventFormValueSet }
  | { ok: false; errors: string[] };

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

function normalizeVisibility(input: unknown): EventVisibility | null {
  if (input === "public") return "public";
  if (input === "org-only") return "org-only";
  if (input === "club") return "club";
  return null;
}

function normalizeOwnerScope(input: unknown): EventOwnerScope | null {
  if (input === "public") return "public";
  if (input === "organisation") return "organisation";
  if (input === "club") return "club";
  return null;
}

export function getAllowedEventFormOptions(context: EventFormContext): EventFormOptions {
  const role = context.role;

  if (role === "admin") {
    return {
      allowedVisibilityOptions: ["public", "org-only", "club"],
      allowedOwnerScopes: ["public", "organisation", "club"],
    };
  }

  if (role !== "organiser") {
    return {
      allowedVisibilityOptions: [],
      allowedOwnerScopes: [],
    };
  }

  const allowedVisibilityOptions: EventVisibility[] = ["public"];
  const allowedOwnerScopes: EventOwnerScope[] = ["public"];

  if (context.hasOrganisationMembership) {
    allowedVisibilityOptions.push("org-only");
    allowedOwnerScopes.push("organisation");
  }

  if (context.hasClubMembership) {
    allowedVisibilityOptions.push("club");
    allowedOwnerScopes.push("club");
  }

  return { allowedVisibilityOptions, allowedOwnerScopes };
}

export function validateEventFormPayload(payload: EventFormPayload, context: EventFormContext): EventFormValidationResult {
  const errors: string[] = [];
  const options = getAllowedEventFormOptions(context);

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (!title) {
    errors.push("title is required");
  }

  const description = typeof payload.description === "string" && payload.description.trim()
    ? payload.description.trim()
    : null;

  const coverImage = typeof payload.coverImage === "string" && payload.coverImage.trim()
    ? payload.coverImage.trim()
    : null;

  const startAtValue = payload.startAt ?? payload.start;
  const endAtValue = payload.endAt ?? payload.end;

  let startAt: Date | null = null;
  let endAt: Date | null = null;

  if (!startAtValue || !endAtValue) {
    errors.push("start and end are required");
  } else {
    startAt = new Date(startAtValue as string | number | Date);
    endAt = new Date(endAtValue as string | number | Date);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      errors.push("start and end must be valid dates");
    } else if (endAt.getTime() <= startAt.getTime()) {
      errors.push("end must be after start");
    }
  }

  let capacity: number | null = null;
  if (payload.capacity !== undefined && payload.capacity !== null && payload.capacity !== "") {
    const parsedCapacity = typeof payload.capacity === "number"
      ? payload.capacity
      : Number.parseInt(String(payload.capacity), 10);

    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
      errors.push("capacity must be a positive integer");
    } else {
      capacity = parsedCapacity;
    }
  }

  const visibility = normalizeVisibility(payload.visibility);
  if (payload.visibility !== undefined && payload.visibility !== null && payload.visibility !== "") {
    if (!visibility) {
      errors.push("visibility must be one of public, org-only, club");
    } else if (!options.allowedVisibilityOptions.includes(visibility)) {
      errors.push("visibility is not allowed for your role or scope");
    }
  }

  const ownerScope = normalizeOwnerScope(payload.ownerScope ?? payload.scope);
  if (payload.ownerScope !== undefined && payload.ownerScope !== null && payload.ownerScope !== "" || payload.scope !== undefined && payload.scope !== null && payload.scope !== "") {
    if (!ownerScope) {
      errors.push("ownerScope must be one of public, organisation, club");
    } else if (!options.allowedOwnerScopes.includes(ownerScope)) {
      errors.push("ownerScope is not allowed for your role or scope");
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    values: {
      title,
      description,
      coverImage,
      startAt: startAt!,
      endAt: endAt!,
      capacity,
      visibility: visibility ?? "public",
      ownerScope: ownerScope ?? "public",
    },
  };
}
