module.exports = [
  {
    requestMatcher: req => req.method === 'GET' && req.path === '/custom-fn',
    response: { status: 200 },
  },

  {
    requestMatcher: req => req.method === 'POST',
    request: { path: '/combined' },
    response: { status: 200 },
  },

  {
    request: { path: '/path-pattern' },
    response: { status: 200 },
  },

  {
    request: {
      path: '/',
      'headers.test-a': 'a',
      'headers.test-b': 'b',
    },
    response: { status: 200 },
  },

  {
    request: {
      path: '/query-pattern',
      'query.a': 'x',
      'query.b': { $in: ['y', 'z'] },
    },
    response: { status: 200 },
  },

  {
    request: {
      path: '/body-pattern',
      body: {
        a: 'x',
        b: 'y',
      }
    },
    response: { status: 200 },
  },

];