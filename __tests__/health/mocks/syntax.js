const { withServer, resolveMockFile } = require('../../../testUtils/server');
const waitForExpect = require('wait-for-expect');

it('tells when mocks could not be loaded', () => withServer({
  '--mocks': resolveMockFile('health/mocks/syntax/correct.js'),
  '--port': 3000,
}, async ({ client, setMocksFile }) => {
  await waitForExpect(async () => {
    expect((await client.get('/s/ping')).data).toEqual('pong');
    expect((await client.get('/admin/health/mocks')).status).toEqual(200);
  });

  let delayedRequestResponseCode;
  client.get('/s/delayed').then((res) => delayedRequestResponseCode = res.status);

 // wait for the request that results in a delayed response to actually
 // hit the server
  await waitForExpect(async () => {
    expect((await client.get('/s/delayed')).data).toEqual('delaying...');
  });

  // change the mocks only after the delayed response has been initialised
  setMocksFile(resolveMockFile('health/mocks/syntax/incorrect.js'));

  await waitForExpect(async () => {
    expect((await client.get('/s/ping')).status).toEqual(404);
    expect((await client.get('/admin/health/mocks')).status).toEqual(500);
    expect(delayedRequestResponseCode).toEqual(400);
  });

  setMocksFile(resolveMockFile('health/mocks/syntax/different_correct.js'));

  await waitForExpect(async () => {
    expect((await client.get('/s/ping')).data).toEqual('PONG!');
    expect((await client.get('/admin/health/mocks')).status).toEqual(200);
  });
}));
