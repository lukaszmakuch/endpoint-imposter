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
      console.warn('Some responses failed. 👎');
      res.status(400).send('Some responses failed. 👎');
    } else if (!anyReleased) {
      console.warn('No response has been released. 👎');
      res.status(400).send('No response has been released. 👎');
    } else {
      res.send('All responses have been released. 👍');
    }
  });

  app.get('/terminate', (req, res) => {
    const sessionId = req.query.session;
    if (!sessions.sessionExists(sessionId)) return res.status(404).end();

    const session = sessions.getSession(sessionId);
    session.pendingResponses.forEach(({ fn }) => fn(true)); 
    sessions.clearSession(sessionId);
    res.status(200).send();   
  });

  return app;
};
