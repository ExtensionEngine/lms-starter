'use strict';

const { CONFLICT, NO_CONTENT } = require('http-status');
const { Sequelize, User, UserGroup, UserGroupMembers } = require('../common/database');
const { createError } = require('../common/errors');
const map = require('lodash/map');
const yn = require('yn');

const { Op } = Sequelize;

const createMembersFilter = q => map(['email', 'firstName', 'lastName'],
  it => ({ [it]: { [Op.iLike]: `%${q}%` } }));

function list({ query, options }, res) {
  const { parentId = null, filter, archived } = query;
  const where = {};
  if (parentId) where.parentId = parentId;
  if (filter) where.name = { [Op.iLike]: `%${filter.trim()}%` };
  const include = { model: User, as: 'members' };
  Object.assign(options, { where, include });
  return UserGroup.findAndCountAll({ ...options, paranoid: !yn(archived) })
    .then(({ rows, count }) => res.jsend.success({ items: rows, total: count }));
}

async function getMembers({ userGroup, query, options }, res) {
  const { filter, archived } = query;
  const where = { userGroupId: userGroup.id };
  const userWhere = filter ? { [Op.or]: createMembersFilter(filter) } : {};
  const include = { model: User, as: 'member', where: userWhere };
  Object.assign(options, { where, include });
  return UserGroupMembers.findAndCountAll({ ...options, paranoid: !yn(archived) })
    .then(({ rows, count }) => res.jsend.success({ items: rows, total: count }));
}

async function create({ body }, res) {
  const { name, parentId = null } = body;
  const [err, userGroup] = await UserGroup.restoreOrCreate({ name, parentId });
  if (err) return createError(CONFLICT, 'User group exists!');
  return res.jsend.success(userGroup);
}

async function patch({ userGroup, body }, res) {
  const data = await userGroup.update({ name: body.name });
  res.jsend.success(data);
}

function remove({ userGroup }, res) {
  return userGroup.destroy().then(() => res.sendStatus(NO_CONTENT));
}

module.exports = {
  list,
  create,
  patch,
  remove,
  getMembers
};
