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

const transition = (session, machine, transitionCountWhenScheduled, nextState) => {
  const currentTransitionCount = getTransitionCount(session, machine);
  if (transitionCountWhenScheduled === currentTransitionCount) {
    session.transitionCounters[machine] = getTransitionCount(session, machine) + 1;
    session.states[machine] = nextState;
  } else {
    const oldState = getMachineState(session, machine);
    throw new Error(`Unable to perform a transition from ${oldState} to ${nextState} in ${machine}, because another transition has already been performed.`);
  }
};

module.exports = {
  makeSessions,
  getTransitionCount,
  getMachineState,
  transition,
};
