const fs = require('fs');
const sift = require('sift').default;
const importFresh = require('import-fresh');
const { getScenarioStep } = require('./sessions.js');

const watchMockConfig = (filename, cb) => {
  const loadFresh = () => {
    try {
      const config = importFresh(filename);
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
  headers: req.headers,
  body: req.body,
});

// TODO: a test for that
const buildPatternBasedRequestMatcher = pattern => {
  const siftMatcher = sift(pattern);
  return req => siftMatcher(prepareRequestForMatching(req));
};

const buildUnifiedRequestMatcher = rawRequestMock => {
  if (rawRequestMock.request && rawRequestMock.requestMatcher) {
    // Both a function and a pattern are provided.
    // TODO: a test for the priority and the fact of these matchers being combined.
    const patternBasedRequestMatcher = buildPatternBasedRequestMatcher(
      rawRequestMock.request
    );
    return req => patternBasedRequestMatcher(req) && rawRequestMock.requestMatcher(req);
  } else if (rawRequestMock.request && !rawRequestMock.requestMatcher) {
    // Just a pattern is provided.
    return buildPatternBasedRequestMatcher(rawRequestMock.request);
  } else if (!rawRequestMock.request && rawRequestMock.requestMatcher) {
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

const buildPatternbasedResponseGenerator = pattern => (req, res) => {
  if (pattern.status) res.status(pattern.status);
  if (pattern.headers) res.set(pattern.headers);
  if (pattern.json) res.json(pattern.json);
  if (pattern.body) res.send(pattern.body);
  res.end();
};

const getOrBuildResponseGenerator = ({ responseGenerator, response }) => {
  if (responseGenerator) return responseGenerator;
  if (response) return buildPatternbasedResponseGenerator(response);
  return (req, res) => res.status(400).send('Missing response generator.'); // TODO: test this
};

// Reduces mocks like 
// {requestPattern, requestMatcher, responseGenerator, response, ...}
// to a unified format like {requestMatcher, responseGenerator, ...}
const unifyMockConfig = rawConfig => {
  return rawConfig.map(rawRequestMock => {
    const requestMatcher = addErrorHandlingToRequestMatcher(
      buildUnifiedRequestMatcher(rawRequestMock)
    );
    const responseGenerator = getOrBuildResponseGenerator(rawRequestMock);
    const pathPrefix = rawRequestMock.pathPrefix || '/';

    return {
      ...rawRequestMock,
      requestMatcher,
      responseGenerator,
      pathPrefix,
    };
  });
};

const mockMatches = (session, req) => mock => {
  if (mock.scenario) {
    const currentStep = getScenarioStep(session, mock.scenario);
    const requiredStep = mock.step;
    if (currentStep !== requiredStep) return false;
  }

  return mock.requestMatcher(req);
};

module.exports = {
  watchMockConfig,
  unifyMockConfig,
  mockMatches,
  prepareRequestForMatching,
};
