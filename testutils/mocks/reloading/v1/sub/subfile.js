module.exports = [
  {
    request: { path: '/a' },
    response: { body: 'A' },
  },
  {
    scenario: 'pending',
    step: 'start',
    afterRequest: 'started-waiting',
    request: { path: '/pending' },
    response: { body: 'released' },
    releaseOn: 'release-pending'
  },
  {
    scenario: 'pending',
    step: 'started-waiting',
    request: { path: '/pending' },
    response: { body: 'not released yet'},
  },
  {
    scenario: 'stateful',
    step: 'start',
    afterRequest: 'changed',
    request: { path: '/stateful' },
    response: { body: 'the initial state' },
  },
];
