module.exports = [

  {
    machine: 'todos',
    state: 'init',
    requestPattern: { method: 'GET', path: '/todos' },
    responseGenerator: (req, res) => res.json({ todos: [1, 2, 3] }),
    continuationKey: 'give_initial_todos',
    afterRequest: 'gave_initial_todos',
  },

  {
    machine: 'todos',
    state: 'gave_initial_todos',
    requestPattern: { method: 'GET', path: '/todos' },
    // TODO: test what happens when the response generator cannot generate a response.
    responseGenerator: (req, res) => res.send('🤔'),
  },

  {
    machine: 'todos',
    state: 'gave_initial_todos',
    requestPattern: { method: 'POST', path: '/add-4' },
    responseGenerator: (req, res) => res.send('🤔'),
    continuationKey: 'finish_adding',
    afterResponse: 'added',
  },

  // TODO: test what happens when there are two transitions registered: afterResponse and afterRequest.
  // It should probably throw some sort of an error.
  {
    machine: 'todos',
    state: 'added',
    requestPattern: { method: 'GET', path: '/todos' },
    responseGenerator: (req, res) => res.json({ todos: [1, 2, 3, 4] }),
    continuationKey: 'give_new_todos',
  },

];
