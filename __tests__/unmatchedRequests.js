const fs = require("fs");
const path = require("path");
const tmp = require("tmp");
const { withServer, resolveMockDir } = require("../testUtils/server");

it("logs deduplicated unmatched requests per session", () => {
  const unmatchedMocksLogPath = tmp.dirSync({ unsafeCleanup: true }).name;
  console.log("unmatchedMocksLogPath", unmatchedMocksLogPath);

  return withServer(
    {
      "--mocks": resolveMockDir("unmatchedRequests"),
      "--port": 3000,
      "--unmatchedMocksLogPath": unmatchedMocksLogPath,
    },
    async ({ client }) => {
      await client.get("/my-session/matched"); // matched, won't be logged
      await client.get("/my-session/aaa");
      await client.post("/my-session/bbb", { key: "value" });
      await client.get("/my-session/aaa"); // duplicate, won't be logged

      expect(
        fs.readFileSync(
          path.join(unmatchedMocksLogPath, "my-session.json"),
          "utf8"
        )
      ).toMatchInlineSnapshot(`
        "[
          {
            "path": "/aaa",
            "method": "GET",
            "query": {},
            "headers": {
              "accept": "application/json, text/plain, */*",
              "user-agent": "axios/1.19.0",
              "accept-encoding": "gzip, compress, deflate, br",
              "host": "127.0.0.1:3000",
              "connection": "keep-alive"
            },
            "body": {}
          },
          {
            "path": "/bbb",
            "method": "POST",
            "query": {},
            "headers": {
              "accept": "application/json, text/plain, */*",
              "content-type": "application/json",
              "user-agent": "axios/1.19.0",
              "content-length": "15",
              "accept-encoding": "gzip, compress, deflate, br",
              "host": "127.0.0.1:3000",
              "connection": "keep-alive"
            },
            "body": {
              "key": "value"
            }
          }
        ]"
      `);
    }
  );
});
