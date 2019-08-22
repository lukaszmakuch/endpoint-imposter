#!/usr/bin/env node
const minimist = require('minimist');
const express = require('express');
const path = require('path');
const fs = require('fs');

const argv = minimist(process.argv.slice(2));

const mocksPath = path.resolve(argv.mocks);
const port = argv.port;

const watchMockConfig = (filename, cb) => {
  const loadFresh = () => {
    try {
      delete require.cache[filename];
      const config = require(filename);
      cb(config);
    } catch (e) {
      console.error('Unable to load the mocks.');
      console.error(e);
    }
  };
  loadFresh();
  fs.watch(mocksPath, {}, (eventType, filename) => {
    if (eventType === 'change') loadFresh();
  });
}

let mockConfig = [];
watchMockConfig(mocksPath, config => mockConfig = config)

const makeNewSession = () => ({
  statesOfMachines: {},
  pendingContinuations: [],
});

let sessions;
const clearAllSessions = () => sessions = [];
clearAllSessions();
const clearSession = sessionId => {
  delete sessions[sessionId];
};
const sessionMiddleware = (req, res, next) => {
  const sessionId = req.params.sessionId;
  if (!sessions[sessionId]) sessions[sessionId] = makeNewSession();
  req.clearSession = () => clearSession(sessionId);
  req.session = sessions[sessionId];
  next();
};

const machineApp = express();

machineApp.get('/admin/continue-all', (req, res) => {
  const { session } = req;
  const continuationKeyToTrigger = req.query.continuationKey;
  let remainingPendingContinuations = [];
  for (let i = 0; i < session.pendingContinuations.length; i++) {
    const pendingContinuation = session.pendingContinuations[i];
    if (pendingContinuation.continuationKey === continuationKeyToTrigger) {
      pendingContinuation.fn();
    } else {
      remainingPendingContinuations.push(pendingContinuation);
    }
  }
  session.pendingContinuations = remainingPendingContinuations;
  res.send('👍');
});

// That's not a machine specific thing - move it up
// machineApp.get('/admin/clear-all', (req, res) => {
//   clearAllSessions();
//   res.send('🌊');
// });

machineApp.get('/admin/clear', (req, res) => {
  req.clearSession();
  res.send('🌊');
});

machineApp.all('/*', (req, res) => {
  const { session } = req;
  const firstMatchingRequest = mockConfig.find(
    ({ requestMatcher, machine, state }) => {
      const machineState = session.statesOfMachines[machine] || 'init'; // TODO: extract getMachineState(session)
      return (
        machineState === state
        && requestMatcher(req)
      );
    }
  );
  if (!firstMatchingRequest) return res.status(400).send('No matching mock. 😭');
  const { continuationKey, responseGenerator } = firstMatchingRequest;
  const sendResponse = () => responseGenerator(req, res);
  if (continuationKey) {
    const continuation = {
      continuationKey,
      fn: sendResponse // TODO: remove fn to just sendResponse
    };
    session.pendingContinuations.push(continuation);
  } else {
    sendResponse();
  }

  const { newState, machine } = firstMatchingRequest;
  if (newState) session.statesOfMachines[machine] = newState;
});

const app = express();

app.use('/:sessionId', [sessionMiddleware, machineApp]);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));