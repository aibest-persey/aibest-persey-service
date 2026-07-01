import assert from "node:assert/strict";
import { getAllowedEventFormOptions, validateEventFormPayload } from "../src/events/event-form-utils.js";

function runTest(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

runTest("returns scoped visibility options for organisers", () => {
  const options = getAllowedEventFormOptions({ role: "organiser", hasOrganisationMembership: true, hasClubMembership: false });
  assert.deepEqual(options.allowedVisibilityOptions, ["public", "org-only"]);
  assert.deepEqual(options.allowedOwnerScopes, ["public", "organisation"]);
});

runTest("validates create/update payloads and normalizes values", () => {
  const result = validateEventFormPayload(
    {
      title: "Launch party",
      startAt: "2026-08-01T10:00:00.000Z",
      endAt: "2026-08-01T12:00:00.000Z",
      capacity: 25,
      visibility: "org-only",
      ownerScope: "organisation",
      description: "A great event",
      coverImage: "https://cdn.example.com/hero.png",
    },
    { role: "organiser", hasOrganisationMembership: true, hasClubMembership: false },
  );

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("expected payload to be valid");
  assert.equal(result.values.title, "Launch party");
  assert.equal(result.values.capacity, 25);
  assert.equal(result.values.visibility, "org-only");
  assert.equal(result.values.ownerScope, "organisation");
});

runTest("rejects invalid time ranges and zero capacity", () => {
  const result = validateEventFormPayload(
    {
      title: "Bad timing",
      startAt: "2026-08-01T12:00:00.000Z",
      endAt: "2026-08-01T10:00:00.000Z",
      capacity: 0,
      visibility: "public",
      ownerScope: "public",
    },
    { role: "organiser", hasOrganisationMembership: false, hasClubMembership: false },
  );

  assert.equal(result.ok, false);
  if (result.ok) throw new Error("expected payload to be invalid");
  assert.ok(result.errors.some((message) => message.includes("end must be after start")));
  assert.ok(result.errors.some((message) => message.includes("capacity must be a positive integer")));
});
