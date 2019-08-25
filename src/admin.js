const express = require('express');

module.exports = ({ sessions }) => {

  const app = express();

  // app.get('/clear', (req, res) => {
  //   const sessionId = req.query.sessionId;
  //   sessions.clearSession(sessionId);
  //   res.send('🌊');
  // });

  app.get('/continue', (req, res) => {
    const sessionId = req.query.session;
    const session = sessions.getSession(sessionId);
    const continuationKeyToTrigger = req.query.continuationKey;
    let remainingPendingContinuations = [];
    let someFailed = false;
    let anyContinued = false;
    for (let i = 0; i < session.continuations.length; i++) {
      const pendingContinuation = session.continuations[i];
      if (pendingContinuation.continuationKey === continuationKeyToTrigger) {
        try {
          pendingContinuation.continuationFn();
          anyContinued = true;
        } catch (e) { // TODO: log this, maybe, if not duplicated
          console.warn(e);
          someFailed = true;
        }
      } else {
        remainingPendingContinuations.push(pendingContinuation);
      }
    }
    session.continuations = remainingPendingContinuations;
    if (someFailed) {
      console.warn('Some continuations failed. 👎', )
      res.status(400).send('Some continuations failed. 👎');
    } else if (!anyContinued) {
      console.warn('No continuation run. 👎')
      res.status(400).send('No continuation run. 👎');
    } else {
      res.send('All continuations have been resolved. 👍');
    }

  });

  return app;
};
