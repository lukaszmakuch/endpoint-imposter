const { withServer, resolveMockFile } = require('../testutils/server');

it('allows to use express response objects', () => withServer({
  '--mocks': resolveMockFile('responses.js'),
  '--port': 3000,
}, async ({ client }) => {
  const response = await client.get('/the-session-id/express-res?number=123');
  expect(response.status).toEqual(500);
  expect(response.data).toEqual('🎉');
  expect(response.headers['x-test-header']).toEqual('123');
}));

it('allows to send JSON using declarative templates', () => withServer({
  '--mocks': resolveMockFile('responses.js'),
  '--port': 3000,
}, async ({ client }) => {
  const response = await client.get('/the-session-id/res-template-json');
  expect(response.status).toEqual(404);
  expect(response.data).toEqual({ 'what?': 'nothing...' });
  expect(response.headers['x-test-header']).toEqual('456');
}));

it('allows to set the raw response body using declarative templates', () => withServer({
  '--mocks': resolveMockFile('responses.js'),
  '--port': 3000,
}, async ({ client }) => {
  const response = await client.get('/the-session-id/res-template-body');
  expect(response.status).toEqual(404);
  expect(response.data).toEqual('🧙‍♂️');
  expect(response.headers['x-test-header']).toEqual('456');
}));

it('supports partial templates - just JSON', () => withServer({
  '--mocks': resolveMockFile('responses.js'),
  '--port': 3000,
}, async ({ client }) => {
  const response = await client.get('/the-session-id/res-template-partial-just-json');
  expect(response.status).toEqual(200);
  expect(response.data).toEqual(['a', 'b']);
}));

it('supports partial templates - just status', () => withServer({
  '--mocks': resolveMockFile('responses.js'),
  '--port': 3000,
}, async ({ client }) => {
  const response = await client.get('/the-session-id/res-template-partial-just-status');
  expect(response.status).toEqual(404);
}));

it('supports partial templates - just headers', () => withServer({
  '--mocks': resolveMockFile('responses.js'),
  '--port': 3000,
}, async ({ client }) => {
  const response = await client.get('/the-session-id/res-template-partial-just-headers');
  expect(response.status).toEqual(200);
  expect(response.headers['x-test']).toEqual('ABC');
}));

it('supports partial templates - just body', () => withServer({
  '--mocks': resolveMockFile('responses.js'),
  '--port': 3000,
}, async ({ client }) => {
  const response = await client.get('/the-session-id/res-template-partial-just-body');
  expect(response.status).toEqual(200);
  expect(response.data).toEqual('💻');
}));
