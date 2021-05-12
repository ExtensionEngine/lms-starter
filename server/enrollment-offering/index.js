'use strict';

const { EnrollmentOffering, OfferingUserGroup } = require('../common/database');
const { createError } = require('../common/errors');
const ctrl = require('./enrollment-offering.controller');
const { NOT_FOUND } = require('http-status');
const userGroupCtrl = require('./offering-user-group.controller');
const router = require('express').Router();

router
  .get('/', ctrl.list)
  .param('offeringId', getOffering);

router
  .param('groupId', getOfferingUserGroup)
  .delete('/:offeringId/user-groups/:groupId', userGroupCtrl.remove);

router
  .route('/:offeringId/user-groups')
  .get(userGroupCtrl.list)
  .post(userGroupCtrl.create);

async function getOfferingUserGroup(req, _, next, groupId) {
  const where = { offeringId: req.offering.id, userGroupId: groupId };
  const offeringUserGroup = await OfferingUserGroup.findOne({ where });
  if (!offeringUserGroup) return createError(NOT_FOUND, 'Not found!');
  req.offeringUserGroup = offeringUserGroup;
  next();
}

async function getOffering(req, _, next, offeringId) {
  const offering = await EnrollmentOffering.findByPk(offeringId);
  if (!offering) return createError(NOT_FOUND, 'Not found!');
  req.offering = offering;
  next();
}

module.exports = {
  path: '/offerings',
  router
};
