#!/usr/bin/env node
const minimist = require('minimist');
const express = require('express');
const path = require('path');

const { makeSessions, getTransitionCount, transition } = require('./sessions');
const makeAdminApp = require('./admin');
const { watchMockConfig, unifyMockConfig, mockMatches, prepareRequestForMatching } = require('./mocks');

const argv = minimist(process.argv.slice(2));

const mocksPath = path.resolve(argv.mocks);
const port = argv.port;

const sessions = makeSessions();
const adminApp = makeAdminApp({ sessions });

let mockConfig;
watchMockConfig(mocksPath, config => {
  sessions.terminateAllSessions();
  mockConfig = unifyMockConfig(config);
});

const machineApp = express();

const transitionActions = (session, mock) => {
  const transitionCountWhenScheduled = getTransitionCount(session, mock.scenario);
  const afterRequest = () => {
    if (mock.afterRequest) transition(session, mock.scenario, transitionCountWhenScheduled, mock.afterRequest);
  };
  const afterResponse = () => {
    if (mock.afterResponse) transition(session, mock.scenario, transitionCountWhenScheduled, mock.afterResponse);
  };
  return { afterRequest, afterResponse };
}

machineApp.use(express.json());
machineApp.use(express.urlencoded({ extended: true }));

machineApp.all('/*', (req, res) => {
  const { sessionId } = req;
  const session = sessions.getSession(sessionId);
  const matchingMock = mockConfig.find(mockMatches(session, req));
  if (!matchingMock) {
    console.warn('No matching mock found for the following request:', prepareRequestForMatching(req));
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

const sessionIdMiddleware = (req, res, next) => {
  req.sessionId = req.params.sessionId;
  next();
};

const app = express();

app.use('/admin', adminApp);
app.use('/:sessionId', [sessionIdMiddleware, machineApp]);

app.listen(port, () => console.log(`Example app listening on port ${port}!`)); // TODO: that's funny 😅, change it.