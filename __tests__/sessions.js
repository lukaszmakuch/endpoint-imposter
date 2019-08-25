const { withServer, resolveMockFile } = require('../testutils/server');
const waitForExpect = require('wait-for-expect');

it('runs multiple instances of the same machine', () => withServer({
  '--mocks': resolveMockFile('sessions.js'),
  '--port': 3000,
}, async ({ client }) => {

  let events = [];

  client.get('/a/read')
    .then(res => events.push(`A got ${res.data}.`));

  await waitForExpect(() => expect(events).toEqual([
    'A got X.',
  ]));

  client.get('/b/read')
    .then(res => events.push(`B got ${res.data}.`));

  await waitForExpect(() => expect(events).toEqual([
    'A got X.',
    'B got X.',
  ]));

  client.get('/a/change');
  client.get('/b/change');

  await waitForExpect(async () => expect(
    (await client.get('/admin/continue?session=a&continuationKey=change')).status
  ).toEqual(200));

  client.get('/a/read')
    .then(res => events.push(`A, read again, got ${res.data}.`));

  await waitForExpect(() => expect(events).toEqual([
    'A got X.',
    'B got X.',
    'A, read again, got Y.',
  ]));

  client.get('/b/read')
    .then(res => events.push(`B, read again, got ${res.data}.`));

  await waitForExpect(() => expect(events).toEqual([
    'A got X.',
    'B got X.',
    'A, read again, got Y.',
    'B, read again, got X.',
  ]));

  await waitForExpect(async () => expect(
    (await client.get('/admin/continue?session=b&continuationKey=change')).status
  ).toEqual(200));

  client.get('/b/read')
    .then(res => events.push(`B, read one more time, got ${res.data}.`));

  await waitForExpect(() => expect(events).toEqual([
    'A got X.',
    'B got X.',
    'A, read again, got Y.',
    'B, read again, got X.',
    'B, read one more time, got Y.',
  ]));

}));