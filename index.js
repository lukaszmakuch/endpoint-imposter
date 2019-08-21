#!/usr/bin/env node
const minimist = require('minimist');
const express = require('express');
const path = require('path');

const argv = minimist(process.argv.slice(2));

const mocksPath = path.resolve(argv.mocks);
const port = argv.port;
const mockConfig = require(mocksPath);

const makeNewSession = () => ({
  statesOfMachines: {},
  pendingContinuations: [],
});

let sessions = [];
const sessionMiddleware = (req, res, next) => {
  const sessionId = req.params.sessionId;
  if (!sessions[sessionId]) sessions[sessionId] = makeNewSession();
  req.session = sessions[sessionId];
  next();
};

const machineApp = express();

machineApp.get('/continue-all', (req, res) => {
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