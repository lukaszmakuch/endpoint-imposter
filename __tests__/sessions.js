const { withServer, resolveMockDir } = require('../testUtils/server');
const waitForExpect = require('wait-for-expect');

it('runs multiple instances of the same machine', () => withServer({
  '--mocks': resolveMockDir('sessions'),
  '--port': 3000,
}, async ({ client }) => {

  let events = [];

  client.get('/a/multiple-instances-test/read')
    .then(res => events.push(`A got ${res.data}.`));

  await waitForExpect(() => expect(events).toEqual([
    'A got X.',
  ]));

  client.get('/b/multiple-instances-test/read')
    .then(res => events.push(`B got ${res.data}.`));

  await waitForExpect(() => expect(events).toEqual([
    'A got X.',
    'B got X.',
  ]));

  client.get('/a/multiple-instances-test/change');
  client.get('/b/multiple-instances-test/change');

  await waitForExpect(async () => expect(
    (await client.get('/admin/release?session=a&key=change')).status
  ).toEqual(200));

  client.get('/a/multiple-instances-test/read')
    .then(res => events.push(`A, read again, got ${res.data}.`));

  await waitForExpect(() => expect(events).toEqual([
    'A got X.',
    'B got X.',
    'A, read again, got Y.',
  ]));

  client.get('/b/multiple-instances-test/read')
    .then(res => events.push(`B, read again, got ${res.data}.`));

  await waitForExpect(() => expect(events).toEqual([
    'A got X.',
    'B got X.',
    'A, read again, got Y.',
    'B, read again, got X.',
  ]));

  await waitForExpect(async () => expect(
    (await client.get('/admin/release?session=b&key=change')).status
  ).toEqual(200));

  client.get('/b/multiple-instances-test/read')
    .then(res => events.push(`B, read one more time, got ${res.data}.`));

  await waitForExpect(() => expect(events).toEqual([
    'A got X.',
    'B got X.',
    'A, read again, got Y.',
    'B, read again, got X.',
    'B, read one more time, got Y.',
  ]));

}));

it('allows to terminate a session', () => withServer({
  '--mocks': resolveMockDir('sessions'),
  '--port': 3000,
}, async ({ client }) => {
  let events = [];

  const handler = prefix => res => events.push(`${prefix} ${res.status === 200 ? res.data : res.status}.`);

  client.get('/a/session-termination-test/test')
    .then(handler('A got'));

  client.get('/b/session-termination-test/test')
    .then(handler('B got'));

  await waitForExpect(async () => expect(
    (await client.get('/admin/release?session=a&key=release')).status
  ).toEqual(200));

  await waitForExpect(() => expect(events).toEqual([
    'A got A.',
  ]));

  await client.get('/admin/terminate?session=b');

  await waitForExpect(async () => expect(
    (await client.get('/admin/terminate?session=x')).status
  ).toEqual(404));

  await waitForExpect(() => expect(events).toEqual([
    'A got A.',
    'B got 400.',
  ]));

  client.get('/a/session-termination-test/test')
    .then(handler('A got'));

  await waitForExpect(() => expect(events).toEqual([
    'A got A.',
    'B got 400.',
    'A got B.',
  ]));

  await waitForExpect(async () => expect(
    (await client.get('/admin/terminate?session=a')).status
  ).toEqual(200));

  client.get('/a/session-termination-test/test')
    .then(handler('A got'));

  await waitForExpect(async () => expect(
    (await client.get('/admin/release?session=a&key=release')).status
  ).toEqual(200));

  await waitForExpect(() => expect(events).toEqual([
    'A got A.',
    'B got 400.',
    'A got B.',
    'A got A.',
  ]));
}));
