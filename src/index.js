#!/usr/bin/env node
const minimist = require('minimist');
const express = require('express');
const path = require('path');

const { makeSessions, getTransitionCount, getMachineState } = require('./sessions');
const makeAdminApp = require('./admin');
const { watchMockConfig, unifyMockConfig, mockMatches } = require('./mocks');

const argv = minimist(process.argv.slice(2));

const mocksPath = path.resolve(argv.mocks);
const port = argv.port;

let mockConfig;
watchMockConfig(mocksPath, config => mockConfig = unifyMockConfig(config))

const sessions = makeSessions();
const adminApp = makeAdminApp({ sessions })

const machineApp = express();

// TODO: extract it to sessions.js
const transition = (session, machine, transitionCountWhenScheduled, nextState) => {
  const currentTransitionCount = getTransitionCount(session, machine);
  if (transitionCountWhenScheduled === currentTransitionCount) {
    // possible to transition
    session.transitionCounters[machine] = getTransitionCount(session, machine) + 1;
    console.log(`Transitione from ${session.states[machine]} to ${nextState}.`);
    session.states[machine] = nextState;
  } else {
    const oldState = getMachineState(session, machine);
    throw new Error(`Unable to perform a transition from ${oldState} to ${nextState} in ${machine}, because another transition has already been performed.`);
  }
}

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

machineApp.all('/*', (req, res) => {
  console.log(`requesting ${req.path}`);
  const { sessionId } = req.params;
  const session = sessions.getSession(sessionId);
  const matchingMock = mockConfig.find(mockMatches(session, req));
  if (!matchingMock) return res.status(400).send('No matching mock. 😭');
  const { afterRequest, afterResponse } = transitionActions(session, matchingMock);

  const { continuationKey, responseGenerator } = matchingMock;
  const sendResponse = () => responseGenerator(req, res);

  if (continuationKey) {
    console.log('getting ready to handle a delayed response with key: ' + continuationKey);
    // This is a mock with a delayed response.
    const continuationFn = (teminate) => {
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