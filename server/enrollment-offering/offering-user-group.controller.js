'use strict';

const { CONFLICT, NO_CONTENT } = require('http-status');
const { OfferingUserGroup, Sequelize, UserGroup } = require('../common/database');
const { createError } = require('../common/errors');
const enrollmentService = require('../enrollment/enrollment.service');

const { Op } = Sequelize;

async function list({ offering, query, options }, res) {
  const { filter } = query;
  const where = { offeringId: offering.id };
  const include = { model: UserGroup, where: {}, attributes: ['id', 'name'] };
  if (filter) include.where.name = { [Op.iLike]: `%${filter.trim()}%` };
  const opts = { ...options, where, include };
  const { rows, count } = await OfferingUserGroup.findAndCountAll(opts);
  return res.jsend.success({ items: rows, total: count });
}

async function create({ offering, body }, res) {
  const { userGroupId } = body;
  const payload = { userGroupId, offeringId: offering.id };
  const opts = { modelSearchKey: ['offeringId', 'userGroupId'] };
  const [err, userGroup] = await OfferingUserGroup.restoreOrCreate(payload, opts);
  if (err) return createError(CONFLICT, 'Offering user group exists!');
  await enrollmentService.enrollOfferingGroup(userGroup);
  return res.jsend.success(userGroup);
}

async function remove({ offeringUserGroup }, res) {
  await offeringUserGroup.destroy();
  await enrollmentService.unenrollOfferingGroup(offeringUserGroup);
  return res.sendStatus(NO_CONTENT);
}

module.exports = {
  list,
  create,
  remove
};
