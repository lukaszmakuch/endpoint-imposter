const emptySessionData = () => ({
  steps: {},
  transitionCounters: {},
  pendingResponses: [],
});

const INITIAL_STEP = 'start';

const getScenarioStep = (session, scenario) => session.steps[scenario] || INITIAL_STEP;

const getTransitionCount = (session, scenario) => session.transitionCounters[scenario] || 0;

const emptySessions = () => [];

const makeSessions = () => {

  let sessions = emptySessions();

  // const clearSession = sessionId => {
  //   delete sessions[sessionId];
  // };

  const sessionExists = sessionId => !!sessions[sessionId];

  const getSession = sessionId => {
    if (!sessionExists(sessionId)) sessions[sessionId] = emptySessionData();
    return sessions[sessionId];
  }

  return {
    sessionExists,
    getSession,
  };
};

const transition = (session, scenario, transitionCountWhenScheduled, nextStep) => {
  const currentTransitionCount = getTransitionCount(session, scenario);
  if (transitionCountWhenScheduled === currentTransitionCount) {
    session.transitionCounters[scenario] = getTransitionCount(session, scenario) + 1;
    session.steps[scenario] = nextStep;
  } else {
    const oldStep = getScenarioStep(session, scenario);
    throw new Error(`Unable to perform a transition from ${oldStep} to ${nextStep} in ${scenario}, because another transition has already been performed.`);
  }
};

module.exports = {
  makeSessions,
  getTransitionCount,
  getScenarioStep,
  transition,
};
