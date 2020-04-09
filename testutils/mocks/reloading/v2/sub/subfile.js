module.exports = [
  {
    request: { path: '/b' },
    response: { body: 'B' },
  },
  {
    scenario: 'stateful',
    step: 'start',
    afterRequest: 'changed',
    request: { path: '/stateful' },
    response: { body: 'the initial state' },
  },
];
