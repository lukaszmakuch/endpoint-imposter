module.exports = [

  {
    machine: 'test',
    state: 'init',
    requestPattern: {
      path: '/test',
      method: 'GET',
    },
    requestMatcher: () => true,
    responseGenerator: (req, res) => res.send('📷'),
  },

  {
    machine: 'test',
    state: 'init',
    requestPattern: {
      path: '/test2',
      method: 'GET',
    },
    requestMatcher: () => true,
    responseGenerator: (req, res) => res.send('🎉'),
  },


  // continuation key test

  {
    machine: 'todo: remove',
    state: 'init', //todo: remove
    requestPattern: {
      path: '/give-it-to-me',
      method: 'GET',
    },
    requestMatcher: () => true,
    responseGenerator: (req, res) => res.send('there you go'),
    continuationKey: 'give-it',
  },

];
