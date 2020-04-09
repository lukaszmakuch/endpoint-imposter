const { withServer, resolveMockDir } = require('../testUtils/server');
const waitForExpect = require('wait-for-expect');
const fs = require('fs');
const path = require('path');

it('allows to reload a file while the server is running', () => withServer({
  '--mocks': resolveMockDir('reloading/v1'),
  '--port': 3000,
}, async ({ client, mockDir }) => {
  await waitForExpect(async () => {
    expect((await client.get('/s/a')).data).toEqual('A');
    expect((await client.get('/s/b')).data).not.toEqual('B');
    expect((await client.get('/s/stateful')).data).toEqual('the initial state');
  });
  
  const pendingRequest = client.get('/s/pending');

  fs.copyFileSync(
    path.resolve(resolveMockDir('reloading/v2'), 'sub', 'subfile.js'),
    path.resolve(mockDir, 'sub', 'subfile.js'),
  );

  // wait for the pending response to be initialised
  await waitForExpect(async () => {
    expect((await client.get('/s/pending')).data).toEqual('not released yet');
  });

  await waitForExpect(async () => {
    expect((await pendingRequest).status).toEqual(400);
    expect((await client.get('/s/a')).data).not.toEqual('A');
    expect((await client.get('/s/b')).data).toEqual('B');
    expect((await client.get('/s/stateful')).data).toEqual('the initial state');
  });
}));
