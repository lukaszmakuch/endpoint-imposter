module.exports = [

  {
    scenario: 'multiple-instances-test',
    step: 'start',
    request: { path: '/multiple-instances-test/read' },
    response: { body: 'X' },
  },

  {
    scenario: 'multiple-instances-test',
    step: 'start',
    afterResponse: 'changed',
    request: { path: '/multiple-instances-test/change' },
    releaseOn: 'change',
  },

  {
    scenario: 'multiple-instances-test',
    step: 'changed',
    request: { path: '/multiple-instances-test/read' },
    response: { body: 'Y' },
  },

  {
    scenario: 'session-termination-test',
    step: 'start',
    afterResponse: 'changed',
    request: { path: '/session-termination-test/test' },
    response: { body: 'A' },
    releaseOn: 'release',
  },

  {
    scenario: 'session-termination-test',
    step: 'changed',
    request: { path: '/session-termination-test/test' },
    response: { body: 'B' },
  },

];
