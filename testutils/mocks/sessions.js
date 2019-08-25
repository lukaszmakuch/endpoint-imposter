module.exports = [

  {
    machine: 'stateful',
    state: 'init',
    requestPattern: { path: '/read' },
    response: { body: 'X' },
  },

  {
    machine: 'stateful',
    state: 'init',
    requestPattern: { path: '/change' },
    continuationKey: 'change',
    afterResponse: 'changed'
  },

  {
    machine: 'stateful',
    state: 'changed',
    requestPattern: { path: '/read' },
    response: { body: 'Y' },
  },

];
