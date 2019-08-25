const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const tmp = require('tmp');
const fs = require('fs');

const resolveMockFile = filename => path.resolve(__dirname, '../testutils/mocks', filename);

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
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    resolve(serverProcess);
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
    baseURL: 'http://localhost:3000/'
  });

  let allResponsePromises = [];
  let networkCallIndex = 0;
  const wrapNetworkCall = method => (...args) => {
    let callId = networkCallIndex++;
    const responsePromise = method(...args);
    console.log('(' + callId + ') started a network call', args)
    allResponsePromises.push(new Promise((resolve) => responsePromise.finally((err, res) => {
      console.log('(' + callId + ') the network call to', args, 'gave', err, res)
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

module.exports = { resolveMockFile, startServer }