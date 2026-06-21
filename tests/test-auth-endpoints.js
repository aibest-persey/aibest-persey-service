/**
 * Endpoint Test Script — Auth + Events
 *
 * Start the server first: npm run dev
 * Then run: node tests/test-auth-endpoints.js
 */

const AUTH_URL = "http://localhost:3000/api/auth";
const EVENTS_URL = "http://localhost:3000/api/events";

const organiserUser = {
  firstName: "Org",
  lastName: "User",
  username: "organiser_" + Date.now(),
  email: "organiser_" + Date.now() + "@example.com",
  password: "OrgPass123!",
};

const studentUser = {
  firstName: "Student",
  lastName: "User",
  username: "student_" + Date.now(),
  email: "student_" + Date.now() + "@example.com",
  password: "StudentPass123!",
};

let organiserToken = "";
let studentToken = "";
let eventId = "";

async function request(method, url, body, authToken) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);
  if (authToken) options.headers["Authorization"] = "Bearer " + authToken;

  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data, ok: res.ok };
}

function assert(condition, message) {
  if (!condition) {
    console.error("  FAIL:", message);
    process.exit(1);
  }
  console.log("  PASS:", message);
}

async function runTests() {
  console.log("\n=== Auth Endpoints ===\n");

  // 1. Register student
  console.log("1. POST /auth/register (student)");
  const reg1 = await request("POST", AUTH_URL + "/register", studentUser);
  assert(reg1.status === 201, `Expected 201, got ${reg1.status}`);

  // 2. Register organiser
  console.log("2. POST /auth/register (organiser)");
  const reg2 = await request("POST", AUTH_URL + "/register", organiserUser);
  assert(reg2.status === 201, `Expected 201, got ${reg2.status}`);

  // 3. Register duplicate
  console.log("3. POST /auth/register (duplicate)");
  const dup = await request("POST", AUTH_URL + "/register", studentUser);
  assert(dup.status === 400, `Expected 400, got ${dup.status}`);
  assert(dup.data.message.includes("already exists"), `Message: ${dup.data.message}`);

  // 4. Login student
  console.log("4. POST /auth/login (student by username)");
  const login1 = await request("POST", AUTH_URL + "/login", {
    identifier: studentUser.username,
    password: studentUser.password,
  });
  assert(login1.status === 200, `Expected 200, got ${login1.status}`);
  assert(login1.data.token, "Token present");
  studentToken = login1.data.token;

  // 5. Login organiser
  console.log("5. POST /auth/login (organiser by email)");
  const login2 = await request("POST", AUTH_URL + "/login", {
    identifier: organiserUser.email,
    password: organiserUser.password,
  });
  assert(login2.status === 200, `Expected 200, got ${login2.status}`);
  assert(login2.data.token, "Token present");
  organiserToken = login2.data.token;

  // Manually promote organiser in DB (role defaults to "student" on register)
  // We'll test role enforcement first, then promote via DB and re-login
  // For now mark organiser token as student token temporarily
  const studentTokenBackup = studentToken;

  // 6. Login wrong password
  console.log("6. POST /auth/login (wrong password)");
  const badLogin = await request("POST", AUTH_URL + "/login", {
    identifier: studentUser.username,
    password: "wrongpassword",
  });
  assert(badLogin.status === 400, `Expected 400, got ${badLogin.status}`);
  assert(badLogin.data.message === "Invalid credentials.", `Message: ${badLogin.data.message}`);

  // 7. GET /me authenticated
  console.log("7. GET /auth/me (authenticated)");
  const me = await request("GET", AUTH_URL + "/me", null, studentToken);
  assert(me.status === 200, `Expected 200, got ${me.status}`);
  assert(me.data.username === studentUser.username, `Username: ${me.data.username}`);
  assert(!me.data.password, "Password not exposed");
  assert(!me.data.ip_encrypted, "IP not exposed");

  // 8. GET /me unauthenticated
  console.log("8. GET /auth/me (unauthenticated)");
  const me2 = await request("GET", AUTH_URL + "/me", null, null);
  assert(me2.status === 401, `Expected 401, got ${me2.status}`);

  // 9. Reset password (invalid token)
  console.log("9. POST /auth/reset-password (invalid token)");
  const reset = await request("POST", AUTH_URL + "/reset-password", {
    token: "invalidtoken",
    id: login1.data.user.id,
    password: "NewPass123!",
  });
  assert(reset.status === 400, `Expected 400, got ${reset.status}`);

  console.log("\n=== Event Endpoints ===\n");

  // 10. Student tries to create event (should be 403)
  console.log("10. POST /events (student — should be forbidden)");
  const badCreate = await request("POST", EVENTS_URL, {
    title: "Forbidden Event",
    date: "2026-09-01T10:00:00Z",
  }, studentToken);
  assert(badCreate.status === 403, `Expected 403, got ${badCreate.status}`);

  // 11. Unauthenticated create event (should be 401)
  console.log("11. POST /events (unauthenticated — should be 401)");
  const unauthedCreate = await request("POST", EVENTS_URL, {
    title: "No Auth Event",
    date: "2026-09-01T10:00:00Z",
  });
  assert(unauthedCreate.status === 401, `Expected 401, got ${unauthedCreate.status}`);

  // NOTE: Both users registered with role "student" by default.
  // To test organiser endpoints, update the organiser's role directly in the DB:
  //   UPDATE users SET role = 'organiser' WHERE username = '<organiser_username>';
  // Then re-run, or implement an admin promotion endpoint.
  console.log("\n  NOTE: Organiser role tests require manual DB promotion.");
  console.log(`  Run: UPDATE users SET role = 'organiser' WHERE username = '${organiserUser.username}';`);
  console.log("  Then re-run this script with SKIP_REGISTRATION=1 (or create a separate organiser test).\n");

  // 12. List events (any logged-in user)
  console.log("12. GET /events (authenticated)");
  const list = await request("GET", EVENTS_URL, null, studentToken);
  assert(list.status === 200, `Expected 200, got ${list.status}`);
  assert(Array.isArray(list.data), "Response is an array");

  // 13. List events unauthenticated
  console.log("13. GET /events (unauthenticated — should be 401)");
  const listUnauth = await request("GET", EVENTS_URL, null, null);
  assert(listUnauth.status === 401, `Expected 401, got ${listUnauth.status}`);

  // 14. Get non-existent event
  console.log("14. GET /events/:id (non-existent)");
  const noEvent = await request("GET", EVENTS_URL + "/00000000-0000-0000-0000-000000000000", null, studentToken);
  assert(noEvent.status === 404, `Expected 404, got ${noEvent.status}`);

  // 15. Student tries to register for non-existent event
  console.log("15. POST /events/:id/register (non-existent event)");
  const badReg = await request("POST", EVENTS_URL + "/00000000-0000-0000-0000-000000000000/register", null, studentToken);
  assert(badReg.status === 404, `Expected 404, got ${badReg.status}`);

  // 16. Unauthenticated register attempt (should be 401)
  console.log("16. POST /events/:id/register (unauthenticated — should be 401)");
  const orgReg = await request("POST", EVENTS_URL + "/00000000-0000-0000-0000-000000000000/register", null, null);
  assert(orgReg.status === 401, `Expected 401, got ${orgReg.status}`);

  console.log("\nAll tests passed!\n");
}

runTests().catch(err => {
  console.error("\nTest suite error:", err.message);
  process.exit(1);
});
