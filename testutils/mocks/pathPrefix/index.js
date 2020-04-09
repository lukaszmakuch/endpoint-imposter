module.exports = [

  {
    pathPrefix: 'pattern',
    request: { 
      path: '/a',
      body: { should: 'match' }
    }, 
    response: { body: 'A' },
  },

  {
    pathPrefix: 'matcher',
    requestMatcher: (req) => req.path === '/b',
    response: { body: 'B' },
  },

  {
    // no prefix
    request: { path: '/c' },
    response: { body: 'C' },
  },

];
