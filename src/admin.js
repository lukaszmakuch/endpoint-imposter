const express = require('express');

const makeResponseGenerator = (req, res) => ({ someFailed, anyReleased }) => {
  if (someFailed) {
    console.warn('Some responses failed. 👎');
    res.status(400).send('Some responses failed. 👎');
  } else if (!anyReleased) {
    console.warn('No response has been released. 👎');
    res.status(400).send('No response has been released. 👎');
  } else {
    res.send('All responses have been released. 👍');
  }
};

const filterLeftRight = (col, cb) => {
  let remaining = [];
  for (let i = 0; i < col.length; i++) cb(col[i], elem => remaining.push(elem));
  return remaining;
};

const filterRightLeft = (col, cb) => {
  let remaining = [];
  for (let i = col.length - 1; i >= 0; i--) cb(col[i], elem => remaining.unshift(elem));
  return remaining;
};

const makeReleaseCb = keyToRelease => pendingResponse => 
  pendingResponse.key === keyToRelease ? 'release' : 'postpone';

const makeSingleReleaseCb = keyToRelease => {
  let someReleased = false;
  return pendingResponse => {
    if (pendingResponse.key === keyToRelease && !someReleased) {
      someReleased = true;
      return 'release';
    } else {
      return 'postpone';
    }
  };
};

module.exports = ({ sessions }) => {

  const updatePendingResponses = ({
    filter, action, sessionId, responseGenerator
  }) => {
    const session = sessions.getSession(sessionId);
    let someFailed = false;
    let anyReleased = false;
    const remainingPendingResponses = filter(session.pendingResponses, (pendingResponse, keep) => {
      switch (action(pendingResponse)) {
        case 'postpone':
          keep(pendingResponse);
          break;
        case 'release':
          try {
            pendingResponse.fn();
            anyReleased = true;
          } catch (e) { // TODO: log this, maybe, if not duplicated
            console.warn(e);
            someFailed = true;
          }
        break;
      }
    });
    session.pendingResponses = remainingPendingResponses;
    responseGenerator({ anyReleased, someFailed });
  }

  const app = express();

  app.get('/releaseOne', (req, res) => {
    updatePendingResponses({
      sessionId: req.query.session,
      filter: filterLeftRight,
      action: makeSingleReleaseCb(req.query.key),
      responseGenerator: makeResponseGenerator(req, res),
    });
  });

  app.get('/releaseOneRight', (req, res) => {
    updatePendingResponses({
      sessionId: req.query.session,
      filter: filterRightLeft,
      action: makeSingleReleaseCb(req.query.key),
      responseGenerator: makeResponseGenerator(req, res),
    });
  });

  app.get('/release', (req, res) => {
    updatePendingResponses({
      sessionId: req.query.session,
      filter: filterLeftRight,
      action: makeReleaseCb(req.query.key),
      responseGenerator: makeResponseGenerator(req, res),
    });
  });

  app.get('/terminate', (req, res) => {
    const sessionId = req.query.session;
    const terminationResult = sessions.terminateSession(sessionId);
    switch (terminationResult) {
      case 'not_found':
        return res.status(404).end();
      case 'terminated':
        return res.status(200).send();
    }
  });

  return app;
};
