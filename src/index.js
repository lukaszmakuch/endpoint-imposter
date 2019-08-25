#!/usr/bin/env node
const minimist = require('minimist');
const express = require('express');
const path = require('path');

const { makeSessions, getTransitionCount, getMachineState, transition } = require('./sessions');
const makeAdminApp = require('./admin');
const { watchMockConfig, unifyMockConfig, mockMatches, prepareRequestForMatching } = require('./mocks');

const argv = minimist(process.argv.slice(2));

const mocksPath = path.resolve(argv.mocks);
const port = argv.port;

let mockConfig;
watchMockConfig(mocksPath, config => mockConfig = unifyMockConfig(config))

const sessions = makeSessions();
const adminApp = makeAdminApp({ sessions })

const machineApp = express();

const transitionActions = (session, mock) => {
  const transitionCountWhenScheduled = getTransitionCount(session, mock.machine);
  const afterRequest = () => {
    if (mock.afterRequest) transition(session, mock.machine, transitionCountWhenScheduled, mock.afterRequest);
  };
  const afterResponse = () => {
    if (mock.afterResponse) transition(session, mock.machine, transitionCountWhenScheduled, mock.afterResponse);
  };
  return { afterRequest, afterResponse };
}

machineApp.use(express.json()) // for parsing application/json
machineApp.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

machineApp.all('/*', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.getSession(sessionId);
  const matchingMock = mockConfig.find(mockMatches(session, req));
  if (!matchingMock) {
    console.warn('No matching mock found for the following request:', prepareRequestForMatching(req));
    console.log('Session:', session);
    return res.status(400).send('No matching mock. 😭');
  }
  const { afterRequest, afterResponse } = transitionActions(session, matchingMock);

  const { continuationKey, responseGenerator } = matchingMock;
  const sendResponse = () => responseGenerator(req, res);

  if (continuationKey) {
    // This is a mock with a delayed response.
    const continuationFn = (teminate) => {
      if (teminate) return res.status(401).send('This pending response has been terminated.');
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
    const continuation = {
      continuationKey,
      continuationFn,
    }
    try {
      afterRequest();
      session.continuations.push(continuation);
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

const app = express();

app.use('/admin', adminApp);
app.use('/:sessionId', machineApp);

app.listen(port, () => console.log(`Example app listening on port ${port}!`)); // TODO: that's funny 😅, change it.