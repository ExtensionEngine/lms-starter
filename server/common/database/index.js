'use strict';

const config = require('./config');
const forEach = require('lodash/forEach');
const Hooks = require('./hooks');
const invoke = require('lodash/invoke');
const { migrationsPath } = require('../../../sequelize.config');
const pick = require('lodash/pick');
const pkg = require('../../../package.json');
const Promise = require('bluebird');
const result = require('lodash/result');
const semver = require('semver');
const Sequelize = require('sequelize');
const Umzug = require('umzug');
const { wrapMethods } = require('./helpers');
const logger = require('../logger')('db');

// Require models.
/* eslint-disable require-sort/require-sort */
const User = require('../../user/user.model');
const Preview = require('../../preview/preview.model');
const Program = require('../../program/program.model');
const Enrollment = require('../../enrollment/enrollment.model');
const EnrollmentOffering = require('../../enrollment-offering/enrollment-offering.model');
const ContentRepo = require('../../content-repo/content-repo.model');
const UserGroup = require('../../user-group/user-group.model');
const UserGroupMembership = require('../../user-group/membership.model');
const OfferingUserGroup = require('../../enrollment-offering/offering-user-group.model');
/* eslint-enable require-sort/require-sort */

const isProduction = process.env.NODE_ENV === 'production';
const sequelize = createConnection(config);
const { Sequelize: { DataTypes } } = sequelize;

const defineModel = Model => {
  const fields = invoke(Model, 'fields', DataTypes, sequelize) || {};
  const options = invoke(Model, 'options') || {};
  wrapMethods(Model, Promise);
  return Model.init(fields, { sequelize, ...options });
};

function initialize() {
  const umzug = new Umzug({
    storage: 'sequelize',
    storageOptions: {
      sequelize,
      tableName: config.migrationStorageTableName
    },
    migrations: {
      params: [sequelize.getQueryInterface(), Sequelize],
      path: migrationsPath
    },
    logging(message) {
      if (message.startsWith('==')) return;
      if (message.startsWith('File:')) {
        const file = message.split(/\s+/g)[1];
        return logger.info({ file }, message);
      }
      return logger.info(message);
    }
  });

  umzug.on('migrating', migration => logger.info({ migration }, '⬆️  Migrating:', migration));
  umzug.on('migrated', migration => logger.info({ migration }, '⬆️  Migrated:', migration));
  umzug.on('reverting', migration => logger.info({ migration }, '⬇️  Reverting:', migration));
  umzug.on('reverted', migration => logger.info({ migration }, '⬇️  Reverted:', migration));

  return sequelize.authenticate()
    .then(() => logger.info(getConfig(sequelize), '🗄️  Connected to database'))
    .then(() => checkPostgreVersion(sequelize))
    .then(() => !isProduction && umzug.up())
    .then(() => umzug.executed())
    .then(migrations => {
      const files = migrations.map(it => it.file);
      if (!files.length) return;
      logger.info({ migrations: files }, '🗄️  Executed migrations:\n', files.join('\n'));
    });
}

const models = {
  User: defineModel(User),
  Preview: defineModel(Preview),
  Program: defineModel(Program),
  Enrollment: defineModel(Enrollment),
  EnrollmentOffering: defineModel(EnrollmentOffering),
  ContentRepo: defineModel(ContentRepo),
  UserGroup: defineModel(UserGroup),
  UserGroupMembership: defineModel(UserGroupMembership),
  OfferingUserGroup: defineModel(OfferingUserGroup)
};

forEach(models, model => {
  addScopes(model, models);
  addHooks(model, Hooks, models);
  invoke(model, 'associate', models);
});

const db = {
  Sequelize,
  sequelize,
  initialize,
  ...models
};

wrapMethods(Sequelize.Model, Promise);
// Patch Sequelize#method to support getting models by class name.
sequelize.model = name => sequelize.models[name] || db[name];

module.exports = db;

function createConnection(config) {
  if (!config.url) return new Sequelize(config);
  return new Sequelize(config.url, config);
}

function getConfig(sequelize) {
  // NOTE: List public fields: https://git.io/fxVG2
  return pick(sequelize.config, [
    'database', 'username', 'host', 'port', 'protocol',
    'pool',
    'native',
    'ssl',
    'replication',
    'dialectModulePath',
    'keepDefaultTimezone',
    'dialectOptions'
  ]);
}

function checkPostgreVersion(sequelize) {
  const type = sequelize.QueryTypes.VERSION;
  return sequelize.query('SHOW server_version', { type })
    .then(version => {
      logger.info({ version }, 'PostgreSQL version:', version);
      const range = pkg.engines && pkg.engines.postgres;
      if (!range) return;
      if (semver.satisfies(semver.coerce(version), range)) return;
      const err = new Error(`"${pkg.name}" requires PostgreSQL ${range}`);
      logger.error({ version, required: range }, err.message);
      return Promise.reject(err);
    });
}

function addHooks(model, Hooks, models) {
  const hooks = invoke(model, 'hooks', Hooks, models);
  forEach(hooks, (it, type) => model.addHook(type, it));
}

function addScopes(Model, models) {
  const scopes = invoke(Model, 'scopes', models);
  forEach(scopes, (scope, name) => {
    if (name === 'defaultScope') scope = result(scopes, 'defaultScope');
    Model.addScope(name, scope, { override: true });
  });
}
