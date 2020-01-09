module.exports = [
  {
    request: { path: '/ping' },
    response: { body: 'pong' },
  },
  {
    request: { path: '/delayed' },
    releaseOn: 'give-delayed',
  },
];
