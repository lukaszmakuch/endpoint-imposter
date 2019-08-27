const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const tmp = require('tmp');
const fs = require('fs');

const resolveMockFile = filename => path.resolve(__dirname, '../testUtils/mocks', filename);

const startServer = async (rawOptions) => {

  // copy the template mocks file to a temporary file
  const mocksFile = tmp.fileSync();
  let options;
  if (rawOptions['--mocks']) {
    fs.copyFileSync(rawOptions['--mocks'], mocksFile.name);
    options = { ...rawOptions, '--mocks': mocksFile.name };
  } else {
    options = rawOptions;
  }

  // wait for the process to start
  const serverProcess = await new Promise((resolve, reject) => {
    const serverProcess = spawn(
      'node',
      [
        path.resolve(__dirname, '..', 'src/index.js'),
        ...Object.entries(options).reduce((soFar, [key, value]) => {
          if (value === undefined) return soFar;
          return [...soFar, key, value];
        }, [])
      ]
    );

    serverProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      resolve(serverProcess);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
      resolve(serverProcess);
    });
  });

  // send the SIGTERM signal and wait for it to close
  const close = () => (new Promise((resolve, reject) => {
    serverProcess.on('exit', (code) => {
      mocksFile.removeCallback();
      resolve();
    });
    serverProcess.kill('SIGTERM');
  }));

  const rawClient = axios.create({
    baseURL: `http://localhost:${options['--port']}/`,
    validateStatus: null,
  });

  let allResponsePromises = [];
  const wrapNetworkCall = method => (...args) => {
    const responsePromise = method(...args);
    allResponsePromises.push(new Promise((resolve) => responsePromise.finally((err, res) => {
      resolve(res);
    })));
    return responsePromise;
  };
  const get = wrapNetworkCall(rawClient.get);
  const post = wrapNetworkCall(rawClient.post);
  const waitForAllResponses = () => Promise.all(allResponsePromises);

  const client = {
    get,
    post,
    waitForAllResponses,
  }

  return { serverProcess, close, client };
};

const withServer = async (options, cb) => {
  const started = await startServer(options);
  try {
    await cb(started);
    await started.client.waitForAllResponses();
    await started.close();
  } catch (e) {
    await started.close();
    throw e;
  }
};

module.exports = { resolveMockFile, startServer, withServer };
