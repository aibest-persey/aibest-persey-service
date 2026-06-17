/**
 * Auth Endpoint Test Script
 * 
 * Run this AFTER setting up PostgreSQL and starting the server:
 *   1. Install PostgreSQL (see instructions)
 *   2. Create the `aibest_persey` database
 *   3. Copy .env from example.env and fill in your credentials
 *   4. Run: node server.js
 *   5. In another terminal, run: node tests/test-auth-endpoints.js
 */

const BASE_URL = "http://localhost:3000/api/auth";
const testUser = {
  firstName: "Test",
  lastName: "User",
  username: "testuser_" + Date.now(),
  email: "test_" + Date.now() + "@example.com",
  password: "TestPass123!",
};

let token = "";
let userId = "";

async function request(method, path, body, authToken) {
  const url = BASE_URL + path;
  var options = {
    method: method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);
  if (authToken) options.headers["Authorization"] = "Bearer " + authToken;

  var res = await fetch(url, options);
  var text = await res.text();
  var data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { raw: text };
  }
  return { status: res.status, data: data, ok: res.ok };
}

function assert(condition, message) {
  if (!condition) {
    console.error("  FAIL: " + message);
    process.exit(1);
  }
  console.log("  PASS: " + message);
}

async function runTests() {
  console.log("\nTest Auth Endpoints\n");

  // 1. Register
  console.log("1. POST /register");
  var reg = await request("POST", "/register", testUser, null);
  assert(reg.status === 201, "Expected 201, got " + reg.status);
  assert(reg.data.message === "User registered successfully.", "Message: " + reg.data.message);

  // 2. Register duplicate
  console.log("2. POST /register (duplicate)");
  var dup = await request("POST", "/register", testUser, null);
  assert(dup.status === 400, "Expected 400, got " + dup.status);
  assert(dup.data.message.indexOf("already exists") !== -1, "Message: " + dup.data.message);

  // 3. Login with username
  console.log("3. POST /login (by username)");
  var login1 = await request("POST", "/login", {
    identifier: testUser.username,
    password: testUser.password,
  }, null);
  assert(login1.status === 200, "Expected 200, got " + login1.status);
  assert(login1.data.token, "Token present");
  assert(login1.data.user.username === testUser.username, "Username: " + login1.data.user.username);
  token = login1.data.token;
  userId = login1.data.user.id;

  // 4. Login with email
  console.log("4. POST /login (by email)");
  var login2 = await request("POST", "/login", {
    identifier: testUser.email,
    password: testUser.password,
  }, null);
  assert(login2.status === 200, "Expected 200, got " + login2.status);
  assert(login2.data.token, "Token present");

  // 5. Login with wrong password
  console.log("5. POST /login (wrong password)");
  var login3 = await request("POST", "/login", {
    identifier: testUser.username,
    password: "wrongpassword",
  }, null);
  assert(login3.status === 400, "Expected 400, got " + login3.status);
  assert(login3.data.message === "Invalid credentials.", "Message: " + login3.data.message);

  // 6. GET /me (authenticated)
  console.log("6. GET /me (authenticated)");
  var me = await request("GET", "/me", null, token);
  assert(me.status === 200, "Expected 200, got " + me.status);
  assert(me.data.username === testUser.username, "Username: " + me.data.username);
  assert(!me.data.password, "Password not exposed");
  assert(!me.data.ip_encrypted, "IP encrypted not exposed");

  // 7. GET /me (unauthenticated)
  console.log("7. GET /me (unauthenticated)");
  var me2 = await request("GET", "/me", null, null);
  assert(me2.status === 401, "Expected 401, got " + me2.status);

  // 8. POST /reset-password (invalid token)
  console.log("8. POST /reset-password (invalid token)");
  var reset = await request("POST", "/reset-password", {
    token: "invalidtoken",
    id: userId,
    password: "NewPass123!",
  }, null);
  assert(reset.status === 400, "Expected 400, got " + reset.status);
  assert(reset.data.message === "Invalid or expired token", "Message: " + reset.data.message);

  console.log("\nAll tests passed!");
}

runTests().catch(function(err) {
  console.error("\nTest suite error: " + err.message);
  process.exit(1);
});