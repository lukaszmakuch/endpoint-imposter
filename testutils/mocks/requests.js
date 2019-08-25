module.exports = [
  {
    requestMatcher: req => req.method === 'GET' && req.path === '/custom-fn',
    response: { status: 200 },
  },

  {
    requestMatcher: req => req.method === 'POST',
    requestPattern: { path: '/combined' },
    response: { status: 200 },
  },

  {
    requestPattern: { path: '/path-pattern' },
    response: { status: 200 },
  },

  {
    requestPattern: {
      path: '/',
      'headers.test-a': 'a',
      'headers.test-b': 'b',
    },
    response: { status: 200 },
  },

  {
    requestPattern: {
      path: '/query-pattern',
      'query.a': 'x',
      'query.b': { $in: ['y', 'z'] },
    },
    response: { status: 200 },
  },

  {
    requestPattern: {
      path: '/body-pattern',
      body: {
        a: 'x',
        b: 'y',
      }
    },
    response: { status: 200 },
  },

];