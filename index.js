const express = require('express');

const mockConfig = {

  Initial: [
    
    {
      requestMatcher: req => {
        return req.path === '/a' && req.method === 'GET'
      },
      responseGenerator: (req, res) => {
        res.send('1');
      },
      continuationKey: 'go-a',
    },

    {
      requestMatcher: req => {
        return req.path === '/set2' && req.method === 'GET'
      },
      responseGenerator: (req, res) => {
        res.send('set');
      },
      newState: 'SetTo2'
    },

  ],

  SetTo2: [

    {
      requestMatcher: req => {
        return req.path === '/a' && req.method === 'GET'
      },
      responseGenerator: (req, res) => {
        res.send('2');
      },
      continuationKey: 'go-a',
    },

  ],

};

const makeNewMachine = () => ({
  state: 'Initial',
  pendingContinuations: [],
});

let machines = [];

const machineApp = express();

machineApp.get('/continue-all', (req, res) => {
  const { machine } = req;
  const continuationKeyToTrigger = req.query.continuationKey;
  let remainingPendingContinuations = [];
  for (let i = 0; i < machine.pendingContinuations.length; i++) {
    const pendingContinuation = machine.pendingContinuations[i];
    if (pendingContinuation.continuationKey === continuationKeyToTrigger) {
      pendingContinuation.fn();
    } else {
      remainingPendingContinuations.push(pendingContinuation);
    }
  }
  machine.pendingContinuations = remainingPendingContinuations;
  res.send('👍')
});

machineApp.all('/*', (req, res) => {
  const { machine } = req;
  const firstMatchingRequest = mockConfig[machine.state].find(
    ({ requestMatcher }) => requestMatcher(req)
  );
  if (!firstMatchingRequest) return res.status(400).send('No matching mock. 😭');
  const { continuationKey, responseGenerator } = firstMatchingRequest;
  const sendResponse = () => responseGenerator(req, res);
  if (continuationKey) {
    const continuation = {
      continuationKey,
      fn: sendResponse
    };
    machine.pendingContinuations.push(continuation);
  } else {
    sendResponse();
  }

  const { newState } = firstMatchingRequest;
  if (newState) machine.state = newState;
});

const machineMiddleware = (req, res, next) => {
  const sessionId = req.params.sessionId;
  if (!machines[sessionId]) machines[sessionId] = makeNewMachine();
  req.machine = machines[sessionId];
  next();
};

const app = express();
const port = 3000;

app.use('/:sessionId', [machineMiddleware, machineApp]);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));