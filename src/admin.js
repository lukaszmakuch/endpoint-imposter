const express = require('express');

module.exports = ({ sessions }) => {

  const app = express();

  app.get('/clear', (req, res) => {
    const sessionId = req.query.sessionId;
    sessions.clearSession(sessionId);
    res.send('🌊');
  });

  app.get('/continue', (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.getSession(sessionId); // consider a middleware for that
    const continuationKeyToTrigger = req.query.continuationKey;
    let remainingPendingContinuations = [];
    for (let i = 0; i < session.pendingContinuations.length; i++) {
      const pendingContinuation = session.pendingContinuations[i];
      if (pendingContinuation.continuationKey === continuationKeyToTrigger) {
        pendingContinuation.fn();
      } else {
        remainingPendingContinuations.push(pendingContinuation);
      }
    }
    session.pendingContinuations = remainingPendingContinuations;
    res.send('👍');
  });

  return app;
};
