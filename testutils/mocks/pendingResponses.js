module.exports = [

  {
    scenario: 'todos',
    step: 'start',
    request: { method: 'GET', path: '/todos' },
    responseGenerator: (req, res) => res.json({ todos: [1, 2, 3] }),
    releaseOn: 'give_initial_todos',
    afterRequest: 'gave_initial_todos',
  },

  {
    scenario: 'todos',
    step: 'gave_initial_todos',
    request: { method: 'GET', path: '/gave_initial_todos' },
    responseGenerator: (req, res) => res.send('ok'),
  },

  {
    scenario: 'todos',
    step: 'gave_initial_todos',
    request: { method: 'GET', path: '/todos' },
    // TODO: test what happens when the response generator cannot generate a response.
    responseGenerator: (req, res) => res.send('🤔'),
  },

  {
    scenario: 'todos',
    step: 'gave_initial_todos',
    request: { method: 'POST', path: '/add-4' },
    responseGenerator: (req, res) => res.send('🤔'),
    releaseOn: 'finish_adding',
    afterResponse: 'added',
  },

  // TODO: test what happens when there are two transitions registered: afterResponse and afterRequest.
  // It should probably throw some sort of an error.
  {
    scenario: 'todos',
    step: 'added',
    request: { method: 'GET', path: '/todos' },
    responseGenerator: (req, res) => res.json({ todos: [1, 2, 3, 4] }),
    releaseOn: 'give_new_todos',
  },

];
