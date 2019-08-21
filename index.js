const express = require('express');

const mockConfig = [
  {
    machine: 'toggle',
    state: 'init',
    requestMatcher: req => req.path === '/binary',
    responseGenerator: (req, res) => res.send('0'),
    newState: 'toggled',
  },
  {
    machine: 'toggle',
    state: 'toggled',
    requestMatcher: req => req.path === '/binary',
    responseGenerator: (req, res) => res.send('1'),
    newState: 'init',
  },
  {
    machine: 'add-todo',
    // mountPath: '/add_todo',
    state: 'init',
    requestMatcher: req => req.path === '/a' && req.method === 'GET',
    responseGenerator: (req, res) => res.send('1'),
    continuationKey: 'go-a',
  },
  {
    machine: 'add-todo',
    // mountPath: '/add_todo',
    state: 'init',
    requestMatcher: req => req.path === '/set2' && req.method === 'GET',
    responseGenerator: (req, res) => res.send('set'),
    newState: 'SetTo2'
  },
  {
    machine: 'add-todo',
    // mountPath: '/add_todo',
    state: 'SetTo2',
    requestMatcher: req => req.path === '/a' && req.method === 'GET',
    responseGenerator: (req, res) => res.send('2'),
    continuationKey: 'go-a', // TODO: rename to "go"
  },
];

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
const port = 3000;

app.use('/:sessionId', [sessionMiddleware, machineApp]);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));