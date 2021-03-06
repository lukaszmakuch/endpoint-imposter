const { withServer, resolveMockDir } = require('../testUtils/server');
const waitForExpect = require('wait-for-expect');

it('allows to add prefix the path', () => withServer({
  '--mocks': resolveMockDir('pathPrefix'),
  '--port': 3000,
}, async ({ client }) => {
  await waitForExpect(async () => {
    expect(
      (await client.post('/s/pattern/a', { should: 'match' })).data
    ).toEqual('A');
    expect(
      (await client.post('/s/pattern/a', { should: 'not match' })).data
    ).not.toEqual('A');

    expect(
      (await client.get('/s/matcher/b')).data
    ).toEqual('B');

    expect(
      (await client.get('/s/c')).data
    ).toEqual('C');
  });
}));
