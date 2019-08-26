module.exports = [

  {
    scenario: 'stateful',
    step: 'start',
    request: { path: '/read' },
    response: { body: 'X' },
  },

  {
    scenario: 'stateful',
    step: 'start',
    afterResponse: 'changed',
    request: { path: '/change' },
    releaseOn: 'change',
  },

  {
    scenario: 'stateful',
    step: 'changed',
    request: { path: '/read' },
    response: { body: 'Y' },
  },

];
