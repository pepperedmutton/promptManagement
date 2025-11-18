const apiWriteLock = (debouncer) => (req, res, next) => {
  debouncer.lock();

  const cleanup = () => {
    res.removeListener('finish', unlockDebouncer);
    res.removeListener('close', unlockDebouncer);
  };

  const unlockDebouncer = () => {
    debouncer.unlock();
    cleanup();
  };

  res.on('finish', unlockDebouncer);
  res.on('close', unlockDebouncer); // Handles aborted requests

  next();
};

module.exports = { apiWriteLock };
