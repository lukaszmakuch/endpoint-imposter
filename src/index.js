#!/usr/bin/env node
const minimist = require('minimist');
const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');

const { makeSessions, getTransitionCount, transition } = require('./sessions');
const makeAdminApp = require('./admin');
const { watchMockConfig, unifyMockConfig, mockMatches, prepareRequestForMatching, makeMocksHealthService } = require('./mocks');

const argv = minimist(process.argv.slice(2));

const mocksPath = path.resolve(argv.mocks);
const port = argv.port;
const httpsPort = argv['https-port'];

const keyPath = argv['https-key'] ? path.resolve(argv['https-key']) : path.resolve(__dirname, 'server.key');
const certPath = argv['https-cert'] ? path.resolve(argv['https-cert']) : path.resolve(__dirname, 'server.cert');

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

const sessions = makeSessions();

// TODO: extract somewhere
const transitionActions = (session, mock) => {
  const transitionCountWhenScheduled = getTransitionCount(session, mock.scenario);
  const afterRequest = () => {
    if (mock.afterRequest) transition(session, mock.scenario, transitionCountWhenScheduled, mock.afterRequest);
  };
  const afterResponse = () => {
    if (mock.afterResponse) transition(session, mock.scenario, transitionCountWhenScheduled, mock.afterResponse);
  };
  return { afterRequest, afterResponse };
};

const groupByPathPrefix = mockConfig => mockConfig.reduce((grouped, mock) => ({
  ...grouped,
  [mock.pathPrefix]: [
    ...(grouped[mock.pathPrefix] || []),
    mock
  ],
}), {});

const makeMockRouter = mockConfig => {
  const mockRouter = express.Router();

  mockRouter.use(express.json());
  mockRouter.use(express.urlencoded({ extended: true }));

  const mocksByPathPrefix = groupByPathPrefix(mockConfig);
  const subAppsToMount = Object.entries(mocksByPathPrefix).map(([prefix, mocks]) => {
    const subApp = express();
    subApp.all('/*', (req, res) => {
      const { sessionId } = req;
      const session = sessions.getSession(sessionId);
      const matchingMock = mocks.find(mockMatches(session, req));
      if (!matchingMock) {
        console.warn('No matching mock found for the following request:', prepareRequestForMatching(req));
        console.warn('The current session:', session);
        return res.status(400).send('No matching mock. 😭');
      }
      const { afterRequest, afterResponse } = transitionActions(session, matchingMock);

      const { releaseOn, responseGenerator } = matchingMock;
      const sendResponse = () => responseGenerator(req, res);

      if (releaseOn) {
        // This is a mock with a delayed response.
        const responseFn = (teminate) => {
          if (teminate) return res.status(400).send('This pending response has been terminated.');
          try {
            afterResponse();
          } catch (e) {
            // The client connected to this mock server will get this response
            // when the delayed response cannot be sent.
            res.status(400).send('Unable to perform the afterResponse transition. 😭');
            throw e;
          };

          sendResponse();
        };
        const pendingResponse = { key: releaseOn, fn: responseFn };
        try {
          afterRequest();
          session.pendingResponses.push(pendingResponse);
        } catch (e) { // TODO: consider logging this
          res.status(400).send('Unable to perform afterRequest. ' + e.message);
        }
      } else {
        try {
          afterRequest();
          afterResponse();
          sendResponse();
        } catch (e) { // TODO: log this
          res.status(400).send(e.message);
        }
      }
    });
    return [prefix, subApp];
  });

  subAppsToMount
    .sort(([prefixA], [prefixB]) => prefixB.length - prefixA.length)
    .forEach(([prefix, subApp]) => mockRouter.use('/' + prefix, subApp));
  
  return mockRouter;
};

const mocksHealth = makeMocksHealthService();

let mockRouter;
watchMockConfig(mocksPath, config => {
  sessions.terminateAllSessions();
  mockRouter = makeMockRouter(unifyMockConfig(config));
  mocksHealth.set(true);
}, () => {
  sessions.terminateAllSessions();
  mockRouter = makeMockRouter(unifyMockConfig([]));
  mocksHealth.set(false);
});

const sessionIdMiddleware = (req, res, next) => {
  req.sessionId = req.params.sessionId;
  next();
};

const app = express();

const adminApp = makeAdminApp({ sessions, mocksHealth });
app.use('/admin', adminApp);
app.use('/:sessionId', [sessionIdMiddleware, (...args) => mockRouter(...args)]);

if (port) app.listen(port, () => console.log(`Endpoint Imposter listening on HTTP ${port}!`));
if (httpsPort) https.createServer(httpsOptions, app).listen(httpsPort, () => console.log(`Endpoint Imposter listening on HTTPS ${httpsPort}!`));
