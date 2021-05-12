'use strict';

const { FORBIDDEN, NOT_FOUND } = require('http-status');
const { UserGroup, UserGroupMembership } = require('../common/database');
const { createError } = require('../common/errors');
const ctrl = require('./user-group.controller');
const get = require('lodash/get');
const membershipCtrl = require('./membership.controller');
const router = require('express').Router();

router
  .param('userGroupId', getUserGroup)
  .use('/:userGroupId', hasUserGroupAccess);

router.route('/')
  .get(ctrl.list)
  .post(hasUserGroupAccess, ctrl.create);

router.route('/:userGroupId')
  .patch(ctrl.patch)
  .delete(ctrl.remove);

router
  .param('userId', attachMembership)
  .use('/:userGroupId/members/:userId', hasMembershipAccess);

router.route('/:userGroupId/members/:userId')
  .patch(membershipCtrl.patch)
  .delete(membershipCtrl.remove);

router.route('/:userGroupId/members')
  .get(membershipCtrl.list)
  .post(membershipCreationAccess, membershipCtrl.create);

async function getUserGroup(req, _, next, userGroupId) {
  const userGroup = await UserGroup.findByPk(userGroupId);
  if (!userGroup) return createError(NOT_FOUND, 'Not found!');
  req.userGroup = userGroup;
  next();
}

async function attachMembership(req, _, next, userId) {
  req.membership = await getMembership(req.userGroup.id, userId);
  next();
}

async function hasUserGroupAccess({ body, user, userGroup }, _, next) {
  const { parentId } = body;
  const userGroupId = parentId || get(userGroup, 'id');
  if (user.isAdmin() || !userGroupId) return next();
  const where = { userId: user.id, userGroupId };
  const membership = await UserGroupMembership.findOne({ where });
  if (membership) return next();
  const context = userGroup || { parentId };
  const hasAncestorInstructor = await UserGroup.hasAncestorInstructor(user, context);
  return hasAncestorInstructor ? next() : createError(NOT_FOUND, 'Not found!');
}

async function membershipCreationAccess({ user, userGroup }, _, next) {
  if (user.isAdmin()) return next();
  const membership = await getMembership(userGroup.id, user.id);
  return membership.isInstructor() ? next() : createError(FORBIDDEN, 'Forbidden!');
}

function hasMembershipAccess({ user, membership }, _, next) {
  const isUserMember = user.id === membership.userId;
  if (user.isAdmin() || membership.isInstructor() || isUserMember) return next();
  return createError(FORBIDDEN, 'Forbidden!');
}

module.exports = {
  path: '/user-groups',
  router
};

async function getMembership(userGroupId, userId) {
  const where = { userGroupId, userId };
  const membership = await UserGroupMembership.findOne({ where });
  return membership || createError(NOT_FOUND, 'Not found!');
}
