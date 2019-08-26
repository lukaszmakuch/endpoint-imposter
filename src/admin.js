const express = require('express');

module.exports = ({ sessions }) => {

  const app = express();

  app.get('/release', (req, res) => {
    const sessionId = req.query.session;
    const session = sessions.getSession(sessionId);
    const keyToTrigger = req.query.key;
    let remainingPendingResponses = [];
    let someFailed = false;
    let anyReleased = false;
    for (let i = 0; i < session.pendingResponses.length; i++) {
      const pendingResponse = session.pendingResponses[i];
      if (pendingResponse.key === keyToTrigger) {
        try {
          pendingResponse.fn();
          anyReleased = true;
        } catch (e) { // TODO: log this, maybe, if not duplicated
          console.warn(e);
          someFailed = true;
        }
      } else {
        remainingPendingResponses.push(pendingResponse);
      }
    }
    session.pendingResponses = remainingPendingResponses;
    if (someFailed) {
      res.status(400).send('Some continuations failed. 👎');
    } else if (!anyReleased) {
      res.status(400).send('No response has been released. 👎');
    } else {
      res.send('All responses have been released. 👍');
    }

  });

  return app;
};
