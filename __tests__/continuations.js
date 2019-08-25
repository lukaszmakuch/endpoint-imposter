const { startServer, resolveMockFile } = require('../testutils/server');
const waitForExpect = require('wait-for-expect');

// TODO: extract it to server.js
const withServer = async (options, cb) => {
  const started = await startServer({
    '--mocks': resolveMockFile('continuations.js'),
    '--port': 3000,
  });
  try {
    await cb(started);
  } finally {
    await started.client.waitForAllResponses();
    await started.close();
  }
};

it('allows to control when a response is sent', async () => {
  await withServer({
    '--mocks': resolveMockFile('continuations.js'),
    '--port': 3000,
  }, async ({ client }) => {
    let events = [];

    events.push('About to fetch todos.');
    client.get('/my-session/todos')
      .then((res) => events.push(['From the first request:', res.data]))

    events.push('About to fetch the same todos one more time.');
    client.get('/my-session/todos')
      .then((res) => events.push(['From the second request:', res.data]));

    await waitForExpect(() => expect(events).toEqual([
      'About to fetch todos.',
      'About to fetch the same todos one more time.',
      ['From the second request:', '🤔'],
    ]));

    client.get('/admin/continue?session=my-session&continuationKey=give_initial_todos');

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

    client.get('/admin/continue?session=my-session&continuationKey=finish_adding');

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
      (await client.get('/admin/continue?session=my-session&continuationKey=give_new_todos')).status
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

  })
});
