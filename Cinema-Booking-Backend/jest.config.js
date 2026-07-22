module.exports = {
  testEnvironment: "node",
  testTimeout: 60000, // first run downloads the in-memory mongod binary
  setupFiles: ["<rootDir>/tests/helpers/setupEnv.js"],
};
