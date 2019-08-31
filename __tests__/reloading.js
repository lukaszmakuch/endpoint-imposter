const { withServer, resolveMockFile } = require('../testUtils/server');
const waitForExpect = require('wait-for-expect');

it('allows to reload a file while the server is running', () => withServer({
  '--mocks': resolveMockFile('reloading/v1.js'),
  '--port': 3000,
}, async ({ client, setMocksFile }) => {
  await waitForExpect(async () => {
    expect((await client.get('/s/a')).data).toEqual('A');
    expect((await client.get('/s/b')).data).not.toEqual('B');
    expect((await client.get('/s/stateful')).data).toEqual('the initial state');
  });

  const pendingRequest = client.get('/s/pending');

  setMocksFile(resolveMockFile('reloading/v2.js'));

  await waitForExpect(async () => {
    expect((await pendingRequest).status).toEqual(400);
    expect((await client.get('/s/a')).data).not.toEqual('A');
    expect((await client.get('/s/b')).data).toEqual('B');
    expect((await client.get('/s/stateful')).data).toEqual('the initial state');
  });
}));

// TODO:
// - resetting state
// - terminating pending requests