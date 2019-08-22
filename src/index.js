#!/usr/bin/env node
const minimist = require('minimist');
const express = require('express');
const path = require('path');

const makeSessions = require('./sessions');
const makeAdminApp = require('./admin');
const { watchMockConfig } = require('./mocks');

const argv = minimist(process.argv.slice(2));

const mocksPath = path.resolve(argv.mocks);
const port = argv.port;

let mockConfig;
watchMockConfig(mocksPath, config => mockConfig = config)

const sessions = makeSessions();
const adminApp = makeAdminApp({ sessions })

const machineApp = express();

machineApp.all('/*', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.getSession(sessionId);
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
      fn: sendResponse // TODO: rename fn to just sendResponse
    };
    session.pendingContinuations.push(continuation);
  } else {
    sendResponse();
  }

  const { newState, machine } = firstMatchingRequest;
  if (newState) session.statesOfMachines[machine] = newState;
});

const app = express();

app.use('/admin', adminApp);
app.use('/:sessionId', machineApp);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));