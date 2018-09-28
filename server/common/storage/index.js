
const getStream = require('get-stream');
const path = require('path');

const isFunction = arg => typeof arg === 'function';

class NotFoundError extends Error {
  constructor(key, { cause } = {}) {
    super(`Item not found [key=${key}]`);
    this.key = key;
    if (cause) this.cause = cause;
  }
}

class Storage {
  constructor(store, { errors = {} } = {}, options = {}) {
    if (!isStore(store)) throw new TypeError('Invalid store provided');
    this.store = store;
    this.errors = errors;
    this.options = options;
  }

  getRepoLocation(repoId, cohortId) {
    return cohortId
      ? `${this.options.importedContentLocation}/${cohortId}/${repoId}`
      : `${this.options.publishedContentLocation}/${repoId}`;
  }

  getFile(key) {
    return getStream(this.store.createReadStream({ key }));
  }

  getItem(key) {
    return this.getFile(key)
      .catch(err => {
        const { notFound } = this.errors;
        // Wrap not found errors using NotFoundError class.
        if (!notFound || !notFound(err)) return Promise.reject(err);
        return Promise.reject(new NotFoundError(key, { cause: err }));
      })
      .then(str => JSON.parse(str));
  }

  fileExists(key) {
    return new Promise((resolve, reject) => {
      this.store.exists({ key }, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  getCatalog() {
    return this.getItem(`${this.options.publishedContentLocation}/index.json`);
  }

  getRepository(repoId) {
    const key = `${this.getRepoLocation(repoId)}/index.json`;
    return this.getItem(key);
  }

  getContainer(repoId, id, cohortId) {
    const key =
      `${this.getRepoLocation(repoId, cohortId)}/${id}.container.json`;
    return this.getItem(key);
  }

  getExam(repoId, id, cohortId) {
    const key = `${this.getRepoLocation(repoId, cohortId)}/${id}.exam.json`;
    return this.getItem(key);
  }

  getAssessments(repoId, id, cohortId) {
    const key =
      `${this.getRepoLocation(repoId, cohortId)}/${id}.assessments.json`;
    return this.getItem(key);
  }

  importRepo(cohortId, repoId) {
    const src = `${this.getRepoLocation(repoId)}/`;
    const dest = `${this.getRepoLocation(repoId, cohortId)}/`;
    return this.store.copyDir(src, dest)
      .then(() => this.getRepository(repoId));
  }
}

function createStorage(options = {}) {
  // Validate provider name.
  const providerName = options.provider;
  if (!options[providerName]) {
    throw new Error('Provider should be defined in config');
  }

  // Validate provider config.
  const config = options[providerName];
  const provider = loadProvider(providerName);
  provider.schema.validate(config, { stripUnknown: true }, err => {
    if (err) throw new Error('Unsupported config structure');
  });

  // Create store & client instance.
  const store = provider.createStore(config);
  const { errors } = provider;
  return new Storage(store, { errors }, options);
}

module.exports = createStorage;
module.exports.NotFoundError = NotFoundError;

function loadProvider(name) {
  try {
    return require(path.join(__dirname, './providers/', name));
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') throw new Error('Unsupported provider');
    throw err;
  }
}

function isStore(obj = {}) {
  return isFunction(obj.createReadStream) || isFunction(obj.exists);
}
