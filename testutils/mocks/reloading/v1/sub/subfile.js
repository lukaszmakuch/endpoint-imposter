module.exports = [
  {
    request: { path: '/a' },
    response: { body: 'A' },
  },
  {
    request: { path: '/pending' },
    response: { body: 'released' },
    releaseOn: 'release-pending'
  },
  {
    scenario: 'stateful',
    step: 'start',
    afterRequest: 'changed',
    request: { path: '/stateful' },
    response: { body: 'the initial state' },
  },
];
