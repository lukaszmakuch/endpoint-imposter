const fs = require('fs');

const watchMockConfig = (filename, cb) => {
  const loadFresh = () => {
    try {
      delete require.cache[filename];
      const config = require(filename);
      cb(config);
    } catch (e) {
      console.error('Unable to load the mocks.');
      console.error(e);
    }
  };
  loadFresh();
  fs.watch(filename, {}, (eventType, filename) => {
    if (eventType === 'change') loadFresh();
  });
}

module.exports = {
  watchMockConfig,
};
