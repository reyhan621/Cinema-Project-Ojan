const { generateCode, hashCode, compareCode, codeExpiry } = require("../src/utils/codes");
const {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require("../src/utils/tokens");

test("codes: generate 6 digits, hash + compare", async () => {
  const code = generateCode();
  expect(code).toMatch(/^\d{6}$/);
  const hash = await hashCode(code);
  expect(await compareCode(code, hash)).toBe(true);
  expect(await compareCode("000000", hash)).toBe(false);
  expect(await compareCode(code, null)).toBe(false);
});

test("codes: expiry is in the future", () => {
  expect(codeExpiry(10).getTime()).toBeGreaterThan(Date.now());
});

test("tokens: access token round-trips with role + tokenVersion", () => {
  const user = { _id: "abc", email: "a@b.com", role: "user", tokenVersion: 2 };
  const decoded = verifyAccessToken(signAccessToken(user));
  expect(decoded.userId).toBe("abc");
  expect(decoded.role).toBe("user");
  expect(decoded.tokenVersion).toBe(2);
});

test("tokens: refresh token carries jti; hashToken is stable", () => {
  const user = { _id: "abc", tokenVersion: 0 };
  const t = signRefreshToken(user);
  expect(verifyRefreshToken(t).jti).toBeDefined();
  expect(hashToken(t)).toBe(hashToken(t));
});
