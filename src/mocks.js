const fs = require('fs');
const sift = require('sift').default;
const { getMachineState } = require('./sessions.js');

const watchMockConfig = (filename, cb) => {
  const loadFresh = () => {
    try {
      delete require.cache[filename];
      const config = require(filename);
      cb(config);
    } catch (e) {
      console.error('Unable to load the mocks.');
      console.error(e);
    }
  };
  loadFresh();
  fs.watch(filename, {}, (eventType, filename) => {
    if (eventType === 'change') loadFresh();
  });
};

const prepareRequestForMatching = req => ({
  path: req.path,
  method: req.method,
  query: req.query,
});

// TODO: a test for that
const buildPatternBasedRequestMatcher = pattern => {
  const siftMatcher = sift(pattern);
  return req => siftMatcher(prepareRequestForMatching(req));
};

const buildUnifiedRequestMatcher = rawRequestMock => {
  if (rawRequestMock.requestPattern && rawRequestMock.requestMatcher) {
    // Both a function and a pattern are provided.
    // TODO: a test for the priority and the fact of these matchers being combined.
    const patternBasedRequestMatcher = buildPatternBasedRequestMatcher(
      rawRequestMock.requestPattern
    );
    return req => patternBasedRequestMatcher(req) && rawRequestMock.requestMatcher(req);
  } else if (rawRequestMock.requestPattern && !rawRequestMock.requestMatcher) {
    // Just a pattern is provided.
    return buildPatternBasedRequestMatcher(rawRequestMock.requestPattern);
  } else if (!rawRequestMock.requestPattern && rawRequestMock.requestMatcher) {
    // Just a function is provided
    return rawRequestMock.requestMatcher;
  } else {
    // There's no matcher at all.
    // TODO: a test for that
    return () => {
      // TODO: some sort of console log
      return false;
    }
  }
};

const addErrorHandlingToRequestMatcher = requestMatcher => req => {
  try {
    return requestMatcher(req);
  } catch (e) {
    console.warn('A request matcher threw an error.', e);
    return false;
  }
};

// Reduces mocks like 
// {requestPattern, requestMatcher, responseGenerator, response, ...}
// to a unified format like {requestMatcher, responseGenerator, ...}
const unifyMockConfig = rawConfig => {
  return rawConfig.map(rawRequestMock => {
    const requestMatcher = addErrorHandlingToRequestMatcher(
      buildUnifiedRequestMatcher(rawRequestMock)
    );

    return {
      ...rawRequestMock,
      requestMatcher,
    };
  });
};

const mockMatches = (session, req) => mock => {
  if (mock.machine) {
    const currentState = getMachineState(session, mock.machine);
    const requiredState = mock.state;
    if (currentState !== requiredState) return false;
  }

  return mock.requestMatcher(req);
};

module.exports = {
  watchMockConfig,
  unifyMockConfig,
  mockMatches,
};
