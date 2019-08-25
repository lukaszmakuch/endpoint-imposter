const emptySessionData = () => ({
  states: {},
  transitionCounters: {},
  continuations: [],
});

const INITIAL_STATE = 'init';

const getMachineState = (session, machine) => session.states[machine] || INITIAL_STATE;

const getTransitionCount = (session, machine) => session.transitionCounters[machine] || 0;

const emptySessions = () => [];

const makeSessions = () => {

  let sessions = emptySessions();
  const clearAllSessions = () => {
    sessions = emptySessions();
  };

  const clearSession = sessionId => {
    delete sessions[sessionId];
  };

  const sessionExists = sessionId => !!sessions[sessionId];

  const getSession = sessionId => {
    if (!sessionExists(sessionId)) sessions[sessionId] = emptySessionData();
    return sessions[sessionId];
  }

  return {
    sessionExists,
    getSession,
    clearSession,
    clearAllSessions,
  };
};

module.exports = {
  makeSessions,
  getTransitionCount,
  getMachineState,
};
