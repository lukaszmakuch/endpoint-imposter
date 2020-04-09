const { withServer, resolveMockDir } = require('../testUtils/server');
const waitForExpect = require('wait-for-expect');

it('allows to send a response to the recent request', () => withServer({
  '--mocks': resolveMockDir('pendingResponses'),
  '--port': 3000,
}, async ({ client }) => {
  let events = [];

  client.get('/s/release-right/releaseOneRight')
    .then((res) => events.push('got 1st ' + res.data));

  await waitForExpect(async () => expect(
    (await client.get('/s/release-right/hit-first')).status
  ).toEqual(200));

  client.get('/s/release-right/releaseOneRight')
    .then((res) => events.push('got 2nd ' + res.data));

  await waitForExpect(async () => expect(
    (await client.get('/s/release-right/hit-second')).status
  ).toEqual(200));

  client.get('/s/release-right/releaseOneRight')
    .then((res) => events.push('got 3rd ' + res.data));

  await waitForExpect(async () => expect(
    (await client.get('/s/release-right/hit-third')).status
  ).toEqual(200));

  await waitForExpect(async () => expect(
    (await client.get('/admin/releaseOneRight?session=s&key=releaseRight')).status
  ).toEqual(200));

  await waitForExpect(() => expect(events).toEqual([
    'got 3rd 🙂',
  ]));

  await waitForExpect(async () => expect(
    (await client.get('/admin/releaseOneRight?session=s&key=releaseRight')).status
  ).toEqual(200));

  await waitForExpect(() => expect(events).toEqual([
    'got 3rd 🙂',
    'got 2nd 🙂',
  ]));

  await waitForExpect(async () => expect(
    (await client.get('/admin/releaseOneRight?session=s&key=releaseRight')).status
  ).toEqual(200));

  await waitForExpect(() => expect(events).toEqual([
    'got 3rd 🙂',
    'got 2nd 🙂',
    'got 1st 🙂',
  ]));

  await waitForExpect(async () => expect(
    (await client.get('/admin/releaseOneRight?session=s&key=releaseRight')).status
  ).toEqual(400));

  await waitForExpect(() => expect(events).toEqual([
    'got 3rd 🙂',
    'got 2nd 🙂',
    'got 1st 🙂',
  ]));
}));

it('allows to send just one of the pending responses', () => withServer({
  '--mocks': resolveMockDir('pendingResponses'),
  '--port': 3000,
}, async ({ client }) => {
  let events = [];

  client.get('/s/release-one/releaseOne')
    .then((res) => events.push('got 1st ' + res.data));

  await waitForExpect(async () => expect(
    (await client.get('/s/release-one/hit-first')).status
  ).toEqual(200));

  client.get('/s/release-one/releaseOne')
    .then((res) => events.push('got 2nd ' + res.data));

  await waitForExpect(async () => expect(
    (await client.get('/s/release-one/hit-second')).status
  ).toEqual(200));

  client.get('/s/release-one/releaseOne')
    .then((res) => events.push('got 3rd ' + res.data));

  await waitForExpect(async () => expect(
    (await client.get('/s/release-one/hit-third')).status
  ).toEqual(200));

  await waitForExpect(async () => expect(
    (await client.get('/admin/releaseOne?session=s&key=releaseOne')).status
  ).toEqual(200));

  await waitForExpect(() => expect(events).toEqual([
    'got 1st 🙂',
  ]));

  await waitForExpect(async () => expect(
    (await client.get('/admin/releaseOne?session=s&key=releaseOne')).status
  ).toEqual(200));

  await waitForExpect(() => expect(events).toEqual([
    'got 1st 🙂',
    'got 2nd 🙂',
  ]));

  await waitForExpect(async () => expect(
    (await client.get('/admin/releaseOne?session=s&key=releaseOne')).status
  ).toEqual(200));

  await waitForExpect(() => expect(events).toEqual([
    'got 1st 🙂',
    'got 2nd 🙂',
    'got 3rd 🙂',
  ]));

  await waitForExpect(async () => expect(
    (await client.get('/admin/releaseOneRight?session=s&key=releaseOne')).status
  ).toEqual(400));

  await waitForExpect(() => expect(events).toEqual([
    'got 1st 🙂',
    'got 2nd 🙂',
    'got 3rd 🙂',
  ]));
}));

it('allows to control when a response is sent', () => withServer({
  '--mocks': resolveMockDir('pendingResponses'),
  '--port': 3000,
}, async ({ client }) => {
  let events = [];

  events.push('About to fetch todos.');
  client.get('/my-session/todos')
    .then((res) => events.push(['From the first request:', res.data]))

  await waitForExpect(async () => expect(
    (await client.get('/my-session/gave_initial_todos')).status
  ).toEqual(200));

  events.push('About to fetch the same todos one more time.');
  client.get('/my-session/todos')
    .then((res) => events.push(['From the second request:', res.data]));

  await waitForExpect(() => expect(events).toEqual([
    'About to fetch todos.',
    'About to fetch the same todos one more time.',
    ['From the second request:', '🤔'],
  ]));

  await waitForExpect(async () => expect(
    (await client.get('/admin/release?session=my-session&key=give_initial_todos')).status
  ).toEqual(200));

  await waitForExpect(() => expect(events).toEqual([
    'About to fetch todos.',
    'About to fetch the same todos one more time.',
    ['From the second request:', '🤔'],
    ['From the first request:', { todos: [1, 2, 3] }],
  ]));

  client.post('/my-session/add-4')
    .then(() => events.push('Added.'));

  events.push('About to fetch todos before adding finished.');
  client.get('/my-session/todos')
    .then((res) => events.push(['From the third request:', res.data]));
  
  await waitForExpect(() => expect(events).toEqual([
    'About to fetch todos.',
    'About to fetch the same todos one more time.',
    ['From the second request:', '🤔'],
    ['From the first request:', { todos: [1, 2, 3] }],
    'About to fetch todos before adding finished.',
    ['From the third request:', '🤔'],
  ]));

  await waitForExpect(async () => expect(
    (await client.get('/admin/release?session=my-session&key=finish_adding')).status
  ).toEqual(200));

  await waitForExpect(() => expect(events).toEqual([
    'About to fetch todos.',
    'About to fetch the same todos one more time.',
    ['From the second request:', '🤔'],
    ['From the first request:', { todos: [1, 2, 3] }],
    'About to fetch todos before adding finished.',
    ['From the third request:', '🤔'],
    'Added.',
  ]));

  client.get('/my-session/todos')
    .then((res) => events.push(['After added:', res.data]));

  await waitForExpect(async () => expect(
    (await client.get('/admin/release?session=my-session&key=give_new_todos')).status
  ).toEqual(200));

  await waitForExpect(() => expect(events).toEqual([
    'About to fetch todos.',
    'About to fetch the same todos one more time.',
    ['From the second request:', '🤔'],
    ['From the first request:', { todos: [1, 2, 3] }],
    'About to fetch todos before adding finished.',
    ['From the third request:', '🤔'],
    'Added.',
    ['After added:', { todos: [1, 2, 3, 4] }],
  ]));
}));

