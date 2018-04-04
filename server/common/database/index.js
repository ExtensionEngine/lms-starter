'use strict';

const config = require('./config');
const forEach = require('lodash/forEach');
const invoke = require('lodash/invoke');
const Sequelize = require('sequelize');

// require models
const User = require('../../user/user.model');

let db = {};
const sequelize = new Sequelize(config.url, config);
const { Sequelize: { DataTypes } } = sequelize;

const defineModel = Model => {
  const fields = invoke(Model, 'fields', DataTypes, sequelize) || {};
  const hooks = invoke(Model, 'hooks') || {};
  const scopes = invoke(Model, 'scopes', sequelize) || {};
  const options = invoke(Model, 'options') || {};
  return Model.init(fields, { sequelize, hooks, scopes, ...options });
};

const models = {
  User: defineModel(User)
};

forEach(models, model => {
  invoke(model, 'associate', models);
  invoke(model, 'addHooks', models);
});

db = Object.assign({
  Sequelize,
  sequelize,
  initialize() { return sequelize.sync(); }
}, models);

// Patch Sequelize#method to support getting models by class name.
sequelize.model = name => sequelize.models[name] || db[name];

module.exports = db;
