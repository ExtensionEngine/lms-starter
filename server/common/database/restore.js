'use strict';

const capitalize = require('change-case').upperCaseFirst;
const find = require('lodash/find');
const Promise = require('bluebird');
const transform = require('lodash/transform');
const { UniqueConstraintError } = require('sequelize');

const name = Model => Model.rawAttributes.modelName || Model.name;
const pTuple = fn => Promise.try(fn).then(result => [null, result], err => [err]);

function processSearchKey(key, item) {
  if (!Array.isArray(key)) return { [key]: item[key] };
  return transform(key, (acc, searchKey) => (acc[searchKey] = item[searchKey]), {});
}

module.exports = {
  restoreOrBuild,
  restoreOrBuildAll,
  restoreOrCreate,
  restoreOrCreateAll
};

async function restoreOrBuildAll(Model, items = [], where = {}, options = {}) {
  const { save = false, concurrency = 16, modelSearchKey = 'id' } = options;
  const found = await Model.findAll({ where, paranoid: false });
  const results = await Promise.map(items, item => pTuple(() => {
    const model = find(found, processSearchKey(modelSearchKey, item));
    if (model && !model.deletedAt) {
      const message = `${capitalize(name(Model))} already exists`;
      throw new UniqueConstraintError({ message });
    }
    if (!model) return save ? Model.create(item) : Model.build(item);
    model.setDataValue('deletedAt', null);
    return save ? model.save() : model;
  }), { concurrency });
  return Array.isArray(items) ? results : results[0];
}

function restoreOrCreateAll(Model, items, where, options) {
  return restoreOrBuildAll(Model, items, where, { ...options, save: true });
}

async function restoreOrBuild(Model, item, options) {
  const [result] = await restoreOrBuildAll(Model, [item], item, options);
  return result;
}

async function restoreOrCreate(Model, item, options) {
  const [result] = await restoreOrCreateAll(Model, [item], item, options);
  return result;
}
