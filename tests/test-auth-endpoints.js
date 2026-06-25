/**
 * Endpoint Test Script — Auth + Events CRUD
 *
 * Start the server first: npm run dev
 * Then run: node tests/test-auth-endpoints.js
 */

const AUTH_URL = "http://localhost:3000/api/auth";
const EVENTS_URL = "http://localhost:3000/api/events";

const ts = Date.now();
const organiserUser = {
  firstName: "Org", lastName: "User",
  username: "organiser_" + ts,
  email: "organiser_" + ts + "@example.com",
  password: "OrgPass123!",
};
const studentUser = {
  firstName: "Student", lastName: "User",
  username: "student_" + ts,
  email: "student_" + ts + "@example.com",
  password: "StudentPass123!",
};

let organiserToken = "";
let studentToken  = "";
let organiserId   = "";
let eventId       = "";

async function request(method, url, body, authToken) {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (body)      options.body = JSON.stringify(body);
  if (authToken) options.headers["Authorization"] = "Bearer " + authToken;
  const res  = await fetch(url, options);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data, ok: res.ok };
}

function assert(condition, message) {
  if (!condition) { console.error("  FAIL:", message); process.exit(1); }
  console.log("  PASS:", message);
}

async function promote(username) {
  // Load .env manually since this script doesn't use tsx/dotenv
  const fs = await import("fs");
  const path = await import("path");
  const envPath = path.resolve(process.cwd(), ".env");
  const envVars = {};
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf8").split("\n").forEach(line => {
      const [k, ...v] = line.split("=");
      if (k && v.length) envVars[k.trim()] = v.join("=").trim().replace(/^"|"$/g, "");
    });
  }

  const { Client } = await import("pg");
  const client = new Client({
    host:     envVars.PG_HOST     || "localhost",
    port:     parseInt(envVars.PG_PORT || "5432"),
    database: envVars.PG_DATABASE || "aibest_persey",
    user:     envVars.PG_USER     || "postgres",
    password: envVars.PG_PASSWORD || "",
  });
  await client.connect();
  await client.query("UPDATE users SET role = 'organiser' WHERE username = $1", [username]);
  await client.end();
}

async function runTests() {
  // ── Auth ────────────────────────────────────────────────────────────────
  console.log("\n=== Auth Endpoints ===\n");

  console.log("1. Register student");
  const r1 = await request("POST", AUTH_URL + "/register", studentUser);
  assert(r1.status === 201, `register student → 201 (got ${r1.status})`);

  console.log("2. Register organiser");
  const r2 = await request("POST", AUTH_URL + "/register", organiserUser);
  assert(r2.status === 201, `register organiser → 201 (got ${r2.status})`);

  console.log("3. Duplicate register");
  const r3 = await request("POST", AUTH_URL + "/register", studentUser);
  assert(r3.status === 400, `duplicate → 400 (got ${r3.status})`);

  console.log("4. Login student");
  const r4 = await request("POST", AUTH_URL + "/login", { identifier: studentUser.username, password: studentUser.password });
  assert(r4.status === 200, `login student → 200 (got ${r4.status})`);
  studentToken = r4.data.token;

  console.log("5. Login organiser (still role=student before promotion)");
  const r5 = await request("POST", AUTH_URL + "/login", { identifier: organiserUser.email, password: organiserUser.password });
  assert(r5.status === 200, `login organiser → 200 (got ${r5.status})`);
  organiserId = r5.data.user.id;

  console.log("6. Wrong password");
  const r6 = await request("POST", AUTH_URL + "/login", { identifier: studentUser.username, password: "wrong" });
  assert(r6.status === 400, `wrong password → 400 (got ${r6.status})`);

  console.log("7. GET /me authenticated");
  const r7 = await request("GET", AUTH_URL + "/me", null, studentToken);
  assert(r7.status === 200, `me → 200 (got ${r7.status})`);
  assert(!r7.data.password, "password not exposed");

  console.log("8. GET /me unauthenticated");
  const r8 = await request("GET", AUTH_URL + "/me", null, null);
  assert(r8.status === 401, `me unauth → 401 (got ${r8.status})`);

  console.log("9. Reset password invalid token");
  const r9 = await request("POST", AUTH_URL + "/reset-password", { token: "bad", id: r4.data.user.id, password: "New123!" });
  assert(r9.status === 400, `reset → 400 (got ${r9.status})`);

  // ── Promote organiser in DB ─────────────────────────────────────────────
  console.log("\n  [Promoting organiser role in DB...]");
  await promote(organiserUser.username);

  console.log("  [Re-login organiser to get updated role in token]");
  const relogin = await request("POST", AUTH_URL + "/login", { identifier: organiserUser.email, password: organiserUser.password });
  assert(relogin.status === 200, `re-login → 200 (got ${relogin.status})`);
  organiserToken = relogin.data.token;

  // ── Event CRUD ──────────────────────────────────────────────────────────
  console.log("\n=== Event Endpoints ===\n");

  console.log("10. Student tries to create event → 403");
  const r10 = await request("POST", EVENTS_URL, { title: "Bad", date: "2026-09-01T10:00:00Z" }, studentToken);
  assert(r10.status === 403, `student create → 403 (got ${r10.status})`);

  console.log("11. Create event as organiser (draft)");
  const r11 = await request("POST", EVENTS_URL, { title: "Tech Conference", description: "Annual tech event", location: "Sofia", date: "2026-09-15T09:00:00Z" }, organiserToken);
  assert(r11.status === 201, `create event → 201 (got ${r11.status})`);
  assert(r11.data.status === "draft", `status is draft (got ${r11.data.status})`);
  eventId = r11.data.id;

  console.log("12. List events as student → draft not visible");
  const r12 = await request("GET", EVENTS_URL, null, studentToken);
  assert(r12.status === 200, `list → 200 (got ${r12.status})`);
  assert(Array.isArray(r12.data), "response is array");
  assert(!r12.data.find(e => e.id === eventId), "draft hidden from student");

  console.log("13. List events as organiser → draft visible with extra fields");
  const r13 = await request("GET", EVENTS_URL, null, organiserToken);
  assert(r13.status === 200, `list → 200 (got ${r13.status})`);
  const ownEvent = r13.data.find(e => e.id === eventId);
  assert(ownEvent, "organiser sees own draft");
  assert(ownEvent.registrationCount !== undefined, "registrationCount present in list");
  assert(ownEvent.isOwner === true, "isOwner true for own event");
  assert(ownEvent.isRegistered !== undefined, "isRegistered field present");

  console.log("14. Student tries to get draft event → 404");
  const r14 = await request("GET", EVENTS_URL + "/" + eventId, null, studentToken);
  assert(r14.status === 404, `student get draft → 404 (got ${r14.status})`);

  console.log("15. Organiser gets draft event → includes registrationCount");
  const r15 = await request("GET", EVENTS_URL + "/" + eventId, null, organiserToken);
  assert(r15.status === 200, `organiser get draft → 200 (got ${r15.status})`);
  assert(r15.data.registrationCount !== undefined, "registrationCount present");

  console.log("16. Update draft event");
  const r16 = await request("PUT", EVENTS_URL + "/" + eventId, { title: "Tech Conference 2026", location: "Plovdiv" }, organiserToken);
  assert(r16.status === 200, `update → 200 (got ${r16.status})`);
  assert(r16.data.title === "Tech Conference 2026", `title updated (got ${r16.data.title})`);
  assert(r16.data.location === "Plovdiv", `location updated (got ${r16.data.location})`);

  console.log("17. Student tries to update event → 403");
  const r17 = await request("PUT", EVENTS_URL + "/" + eventId, { title: "Hacked" }, studentToken);
  assert(r17.status === 403, `student update → 403 (got ${r17.status})`);

  console.log("18. Student tries to register for draft event → 404");
  const r18 = await request("POST", EVENTS_URL + "/" + eventId + "/register", null, studentToken);
  assert(r18.status === 404, `register for draft → 404 (got ${r18.status})`);

  console.log("19. Publish event");
  const r19 = await request("PATCH", EVENTS_URL + "/" + eventId + "/publish", null, organiserToken);
  assert(r19.status === 200, `publish → 200 (got ${r19.status})`);
  assert(r19.data.status === "published", `status is published (got ${r19.data.status})`);

  console.log("20. Publish already published event → 400");
  const r20 = await request("PATCH", EVENTS_URL + "/" + eventId + "/publish", null, organiserToken);
  assert(r20.status === 400, `double publish → 400 (got ${r20.status})`);

  console.log("21. Try to edit published event → 400");
  const r21 = await request("PUT", EVENTS_URL + "/" + eventId, { title: "Changed" }, organiserToken);
  assert(r21.status === 400, `edit published → 400 (got ${r21.status})`);

  console.log("22. Student sees published event in list with correct fields");
  const r22 = await request("GET", EVENTS_URL, null, studentToken);
  const pubEvent = r22.data.find(e => e.id === eventId);
  assert(pubEvent, "student sees published event");
  assert(pubEvent.registrationCount !== undefined, "registrationCount in student list");
  assert(pubEvent.isRegistered === false, "isRegistered false before registering");
  assert(pubEvent.isOwner === false, "isOwner false for student");

  console.log("23. Student gets published event → includes registrationCount");
  const r23 = await request("GET", EVENTS_URL + "/" + eventId, null, studentToken);
  assert(r23.status === 200, `get published → 200 (got ${r23.status})`);
  assert(r23.data.registrationCount === 0, `registrationCount is 0 (got ${r23.data.registrationCount})`);

  console.log("24. Student registers for event");
  const r24 = await request("POST", EVENTS_URL + "/" + eventId + "/register", null, studentToken);
  assert(r24.status === 201, `register → 201 (got ${r24.status})`);

  console.log("25. Student registers again → 409");
  const r25 = await request("POST", EVENTS_URL + "/" + eventId + "/register", null, studentToken);
  assert(r25.status === 409, `double register → 409 (got ${r25.status})`);

  console.log("26. registrationCount is now 1 and isRegistered is true");
  const r26a = await request("GET", EVENTS_URL + "/" + eventId, null, studentToken);
  assert(r26a.data.registrationCount === 1, `getEvent registrationCount is 1 (got ${r26a.data.registrationCount})`);
  const r26b = await request("GET", EVENTS_URL, null, studentToken);
  const afterReg = r26b.data.find(e => e.id === eventId);
  assert(afterReg.registrationCount === 1, `list registrationCount is 1 (got ${afterReg.registrationCount})`);
  assert(afterReg.isRegistered === true, "isRegistered true after registering");

  console.log("27. Organiser gets participants");
  const r27 = await request("GET", EVENTS_URL + "/" + eventId + "/participants", null, organiserToken);
  assert(r27.status === 200, `participants → 200 (got ${r27.status})`);
  assert(r27.data.registrationCount === 1, `1 participant (got ${r27.data.registrationCount})`);
  assert(r27.data.participants[0].student.username === studentUser.username, "correct student");

  console.log("28. Student tries to get participants → 403");
  const r28 = await request("GET", EVENTS_URL + "/" + eventId + "/participants", null, studentToken);
  assert(r28.status === 403, `student participants → 403 (got ${r28.status})`);

  console.log("29. Unpublish event");
  const r29 = await request("PATCH", EVENTS_URL + "/" + eventId + "/unpublish", null, organiserToken);
  assert(r29.status === 200, `unpublish → 200 (got ${r29.status})`);
  assert(r29.data.status === "draft", `status back to draft (got ${r29.data.status})`);

  console.log("30. Update after unpublish works");
  const r30 = await request("PUT", EVENTS_URL + "/" + eventId, { title: "Final Title" }, organiserToken);
  assert(r30.status === 200, `update after unpublish → 200 (got ${r30.status})`);

  console.log("31. ?status=draft filter — organiser sees only drafts");
  const r31a = await request("GET", EVENTS_URL + "?status=draft", null, organiserToken);
  assert(r31a.status === 200, `status=draft → 200 (got ${r31a.status})`);
  assert(r31a.data.every(e => e.status === "draft"), "all results are drafts");
  assert(r31a.data.find(e => e.id === eventId), "current event (draft) is in results");

  console.log("32. ?upcoming=true filter — excludes past events");
  const r31b = await request("GET", EVENTS_URL + "?upcoming=true", null, studentToken);
  assert(r31b.status === 200, `upcoming=true → 200 (got ${r31b.status})`);
  const now = new Date();
  assert(r31b.data.every(e => new Date(e.date) >= now), "all results are upcoming");

  console.log("34. Delete event");
  const r34 = await request("DELETE", EVENTS_URL + "/" + eventId, null, organiserToken);
  assert(r34.status === 200, `delete → 200 (got ${r34.status})`);

  console.log("35. Deleted event no longer found");
  const r35 = await request("GET", EVENTS_URL + "/" + eventId, null, organiserToken);
  assert(r35.status === 404, `after delete → 404 (got ${r35.status})`);

  console.log("36. Unauthenticated list → 401");
  const r36 = await request("GET", EVENTS_URL, null, null);
  assert(r36.status === 401, `unauth list → 401 (got ${r36.status})`);

  console.log("\nAll 36 tests passed!\n");
}

runTests().catch(err => {
  console.error("\nTest suite error:", err.message);
  process.exit(1);
});
