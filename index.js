const express = require('express');
const app = express();
const port = 3000;

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

let machine = {
  state: 'Initial',
  pendingContinuations: [],
}

app.get('/continue-all', (req, res) => {
  for (let i = 0; i < machine.pendingContinuations.length; i++) {
    machine.pendingContinuations[i].fn();
  }
  machine.pendingContinuations = [];
  res.send('👍')
});

app.all('/*', (req, res) => {

  const firstMatchingRequest = mockConfig[machine.state].find(
    ({ requestMatcher }) => requestMatcher(req)
  );
  if (!firstMatchingRequest) res.status(400).send('No matching mock. 😭');
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

app.listen(port, () => console.log(`Example app listening on port ${port}!`));