module.exports = [
  {
    request: { path: '/ping' },
    response: { body: 'pong' },
  },

  {
    scenario: 'delayed',
    step: 'start',
    request: { path: '/delayed' },
    releaseOn: 'give-delayed',
    response: { body: 'this will be delayed' },
    afterRequest: 'started-delaying',
  },
  {
    scenario: 'delayed',
    step: 'started-delaying',
    request: { path: '/delayed' },
    response: { body: 'delaying...' },
  },
];
