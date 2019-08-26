const { withServer, resolveMockFile } = require('../testUtils/server');
const querystring = require('querystring');

it('allows to match express request objects with a custom function', () => withServer({
  '--mocks': resolveMockFile('requests.js'),
  '--port': 3000,
}, async ({ client }) => {
  const response = await client.get('/s/custom-fn');
  expect(response.status).toEqual(200);
  expect((await client.get('/s/something-else')).status).not.toEqual(200);
}));

it('combines custom functions with patterns', () => withServer({
  '--mocks': resolveMockFile('requests.js'),
  '--port': 3000,
}, async ({ client }) => {
  const response = await client.post('/s/combined');
  expect(response.status).toEqual(200);
  expect((await client.get('/s/combined')).status).not.toEqual(200);
  expect((await client.post('/s/something-else')).status).not.toEqual(200);
}));

it('supports path patterns', () => withServer({
  '--mocks': resolveMockFile('requests.js'),
  '--port': 3000,
}, async ({ client }) => {
  const response = await client.get('/s/path-pattern');
  expect(response.status).toEqual(200);
  expect((await client.get('/s/other-path')).status).not.toEqual(200);
}));

it('supports headers patterns', () => withServer({
  '--mocks': resolveMockFile('requests.js'),
  '--port': 3000,
}, async ({ client }) => {
  expect((await client.get('/s/', { headers: { 
    'Test-a': 'a', 'test-b': 'b',
  } })).status).toEqual(200);
  expect((await client.get('/s/', { headers: { 
    'test-a': 'a', 'test-B': 'b', 'Test-C': 'c',
  } })).status).toEqual(200);
  expect((await client.get('/s/', { headers: { 
    'test-a': 'a', 'test-b': 'c',
  } })).status).not.toEqual(200);
  expect((await client.get('/s/', { headers: { 
    'test-a': 'a',
  } })).status).not.toEqual(200);
}));

it('supports query patterns', () => withServer({
  '--mocks': resolveMockFile('requests.js'),
  '--port': 3000,
}, async ({ client }) => {
  expect((await client.get('/s/query-pattern?a=x&b=y')).status).toEqual(200);
  expect((await client.get('/s/query-pattern?a=x&b=z')).status).toEqual(200);
  expect((await client.get('/s/query-pattern?a=x&b=y&c=z')).status).toEqual(200);
  expect((await client.get('/s/query-pattern?a=y&b=z')).status).not.toEqual(200);
  expect((await client.get('/s/query-pattern?a=x')).status).not.toEqual(200);
}));

it('supports body patterns', () => withServer({
  '--mocks': resolveMockFile('requests.js'),
  '--port': 3000,
}, async ({ client }) => {
  expect((await client.post('/s/body-pattern', {a: 'x', b: 'y'})).status).toEqual(200);
  expect((await client.post('/s/body-pattern', {a: 'x', b: 'z'})).status).not.toEqual(200);
  expect((await client.post('/s/body-pattern', querystring.stringify({a: 'x', b: 'y'}))).status).toEqual(200);
  expect((await client.post('/s/body-pattern', querystring.stringify({a: 'x', b: 'z'}))).status).not.toEqual(200);
}));