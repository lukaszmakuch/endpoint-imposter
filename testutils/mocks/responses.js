module.exports = [

  {
    requestPattern: { method: 'GET', path: '/express-res' },
    responseGenerator: (req, res) => 
      res.status(500)
      .set('X-Test-Header', req.query.number)
      .send('🎉'),
  },

  // TODO: what if this function throws an exception?
  // TODO: what if mandatory fields are missing?
  // TODO: what if no way of providing responses is provided?

  {
    requestPattern: { method: 'GET', path: '/res-template-json' },
    response: {
      headers: { 'X-Test-Header': 456 },
      status: 404,
      json: { 'what?': 'nothing...' },
    }
  },

  {
    requestPattern: { method: 'GET', path: '/res-template-body' },
    response: {
      headers: { 'X-Test-Header': 456 },
      status: 404,
      body: '🧙‍♂️',
    }
  },

  {
    requestPattern: { method: 'GET', path: '/res-template-partial-just-json' },
    response: {
      json: ['a', 'b'],
    }
  },

  {
    requestPattern: { method: 'GET', path: '/res-template-partial-just-status' },
    response: {
      status: 404,
    }
  },

  {
    requestPattern: { method: 'GET', path: '/res-template-partial-just-headers' },
    response: {
      headers: { 'X-Test': 'ABC' },
    }
  },

  {
    requestPattern: { method: 'GET', path: '/res-template-partial-just-body' },
    response: {
      body: '💻'
    }
  },

];
