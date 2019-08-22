const makeNewSession = () => ({
  statesOfMachines: {},
  pendingContinuations: [],
});

const makeEmptySessions = () => [];

module.exports = () => {

  let sessions = makeEmptySessions();
  const clearAllSessions = () => {
    sessions = makeEmptySessions();
  };

  const clearSession = sessionId => {
    delete sessions[sessionId];
  };

  const getSession = sessionId => {
    if (!sessions[sessionId]) sessions[sessionId] = makeNewSession();
    return sessions[sessionId];
  }

  return {
    getSession,
    clearSession,
    clearAllSessions,
  };
};
