const fs = require("fs");
const path = require("path");
const hash = require("object-hash");

const { prepareRequestForMatching } = require("./mocks");

const makeUnmatchedLogger = (logPath) => {
  fs.mkdirSync(logPath, { recursive: true });

  const sessions = new Map();

  const getSessionData = (sessionId) => {
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, { seen: new Set(), entries: [] });
    }
    return sessions.get(sessionId);
  };

  const log = (sessionId, preparedRequest) => {
    const data = getSessionData(sessionId);
    const key = hash(preparedRequest);
    if (data.seen.has(key)) return;

    data.seen.add(key);
    data.entries.push(preparedRequest);

    const filePath = path.join(logPath, `${sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data.entries, null, 2));
  };

  return { log };
};

const makeUnmatchedRequestMiddleware = (logPath) => {
  const onUnmatched = logPath
    ? makeUnmatchedLogger(path.resolve(logPath)).log
    : null;

  return (req, res) => {
    const prepared = prepareRequestForMatching(req);
    if (onUnmatched) {
      onUnmatched(req.sessionId, prepared);
    } else {
      console.warn("No matching mock found for the following request:", prepared);
    }
    
    return res.status(404).send("No matching mock. 😭");
  };
};

module.exports = { makeUnmatchedRequestMiddleware };
