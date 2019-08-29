const { withServer, resolveMockFile } = require('../testUtils/server');
const waitForExpect = require('wait-for-expect');

it('allows to reload a file while the server is running', () => withServer({
  '--mocks': resolveMockFile('reloading/v1.js'),
  '--port': 3000,
}, async ({ client, setMocksFile }) => {
  await waitForExpect(async () => {
    expect((await client.get('/s/a')).data).toEqual('A');
    expect((await client.get('/s/b')).data).not.toEqual('B');
  });

  setMocksFile(resolveMockFile('reloading/v2.js'));

  await waitForExpect(async () => {
    expect((await client.get('/s/a')).data).not.toEqual('A');
    expect((await client.get('/s/b')).data).toEqual('B');
  });
}));

// TODO:
// - resetting state
// - terminating pending requests