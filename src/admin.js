const express = require('express');

module.exports = ({ sessions }) => {

  const app = express();

  // app.get('/clear', (req, res) => {
  //   const sessionId = req.query.sessionId;
  //   sessions.clearSession(sessionId);
  //   res.send('🌊');
  // });

/*
   const continuation = {
      continuationKey,
      continuationFn,
    }
*/
  app.get('/continue', (req, res) => {
    const { sessionId } = req.params;
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
          someFailed = true;
        }
      } else {
        remainingPendingContinuations.push(pendingContinuation);
      }
    }
    session.continuations = remainingPendingContinuations;
    if (someFailed) {
      res.status(400).send('Some continuations failed. 👎');
    } else if (!anyContinued) {
      res.status(400).send('No continuation run. 👎');
    } else {
      res.send('All continuations have been resolved. 👍');
    }

  });

  return app;
};
