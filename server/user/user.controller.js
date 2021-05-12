'use strict';

const { Enrollment, Sequelize, sequelize, User } = require('../common/database');
const Audience = require('../common/auth/audience');
const { createError } = require('../common/errors');
const Datasheet = require('./datasheet');
const { generate } = require('./helpers');
const HttpStatus = require('http-status');
const { importTemplateFormat } = require('./../config');
const map = require('lodash/map');
const mime = require('mime');
const pick = require('lodash/pick');

const { ACCEPTED, BAD_REQUEST, CONFLICT, NO_CONTENT, NOT_FOUND } = HttpStatus;
const { EmptyResultError, Op } = Sequelize;

const WRONG_CREDENTIALS_MESSAGE = 'Incorrect email or password.';

const columns = {
  email: { header: 'Email', width: 30 },
  firstName: { header: 'First Name', width: 30 },
  lastName: { header: 'Last Name', width: 30 },
  role: { header: 'Role', width: 30 }
};
const inputAttrs = ['email', 'role', 'firstName', 'lastName'];

const createFilter = q => map(['email', 'firstName', 'lastName'],
  it => ({ [it]: { [Op.iLike]: `%${q}%` } }));

async function list({ query, options }, res) {
  const { email, role, filter, archived, userIds } = query;
  const where = { [Op.and]: [] };
  if (filter) where[Op.or] = createFilter(filter);
  if (email) where[Op.and].push({ email });
  if (role) where[Op.and].push({ role });
  if (userIds) where[Op.not] = { id: userIds };
  const opts = { where, ...options, paranoid: !archived };
  const { rows, count } = await User.findAndCountAll(opts);
  return res.jsend.success({ items: map(rows, 'profile'), total: count });
}

async function create({ body, origin }, res) {
  const options = { modelSearchKey: 'email' };
  const [err, user] = await User.restoreOrCreate(pick(body, inputAttrs), options);
  if (err) return createError(CONFLICT, 'User exists!');
  await User.invite(user, { origin });
  res.jsend.success(user.profile);
}

function patch({ params, body }, res) {
  return User.findByPk(params.id, { paranoid: false, rejectOnEmpty: true })
    .catch(EmptyResultError, () => createError(NOT_FOUND, 'User does not exist!'))
    .then(user => user.update(pick(body, inputAttrs)))
    .then(user => res.jsend.success(user.profile));
}

function destroy({ params }, res) {
  return sequelize.transaction(async transaction => {
    const user = await User.findByPk(params.id, { transaction, rejectOnEmpty: true });
    await Enrollment.destroy({ where: { learnerId: user.id }, transaction });
    return user.destroy({ transaction });
  })
  .catch(EmptyResultError, () => createError(NOT_FOUND))
  .then(() => res.sendStatus(NO_CONTENT));
}

function login({ body }, res) {
  const { email, password } = body;
  if (!email || !password) {
    return createError(BAD_REQUEST, 'Please enter email and password!');
  }

  return User.findOne({ where: { email } })
    .then(user => user || createError(NOT_FOUND, WRONG_CREDENTIALS_MESSAGE))
    .then(user => user.authenticate(password))
    .then(user => user || createError(NOT_FOUND, WRONG_CREDENTIALS_MESSAGE))
    .then(user => {
      const token = user.createToken({
        audience: Audience.Scope.Access,
        expiresIn: '5 days'
      });
      res.jsend.success({ token, user: user.profile });
    });
}

function logout({ user }, res) {
  // TODO: Add token invalidation
  User.stopActivityLog(user.id);
  return res.end();
}

function invite({ params, origin }, res) {
  return User.findByPk(params.id, { paranoid: false })
    .then(user => user || createError(NOT_FOUND, 'User does not exist!'))
    .then(user => User.invite(user, { origin }))
    .then(() => res.status(ACCEPTED).end());
}

function forgotPassword({ origin, body }, res) {
  const { email } = body;
  return User.findOne({ where: { email }, rejectOnEmpty: true })
    .catch(EmptyResultError, () => createError(NOT_FOUND, 'User not found!'))
    .then(user => user.sendResetToken({ origin }))
    .then(() => res.end());
}

function resetPassword({ body }, res) {
  const { password, token } = body;
  return User.findOne({ where: { token }, rejectOnEmpty: true })
    .catch(EmptyResultError, () => createError(NOT_FOUND, 'Invalid token!'))
    .then(user => {
      user.password = password;
      return user.save();
    })
    .then(() => res.end());
}

async function bulkImport({ body, file, origin }, res) {
  const users = (await Datasheet.load(file)).toJSON({ include: inputAttrs });
  const errors = await bulkCreate(users, { origin });
  res.set('data-imported-count', users.length - errors.length);
  if (!errors) return res.end();
  const creator = 'Boutique';
  columns.message = { header: 'Error', width: 30 };
  const report = (new Datasheet({ columns, data: errors })).toWorkbook({ creator });
  const format = body.format || mime.getExtension(file.mimetype);
  return report.send(res, { format });
}

function getImportTemplate(_req, res) {
  const creator = 'Boutique';
  const data = generate();
  const report = (new Datasheet({ columns, data })).toWorkbook({ creator });
  return report.send(res, { format: importTemplateFormat });
}

module.exports = {
  list,
  create,
  bulkImport,
  patch,
  destroy,
  login,
  logout,
  invite,
  forgotPassword,
  resetPassword,
  getImportTemplate
};

async function bulkCreate(users, { concurrency = 16, ...options } = {}) {
  const errors = [];
  await User.restoreOrCreateAll(users, { concurrency, modelSearchKey: 'email' })
    .map(([err, user], index) => {
      if (!err && user) return User.invite(user, options);
      const { message = 'Failed to import user.' } = err;
      errors.push({ ...users[index], message });
    }, { concurrency });
  return errors.length && errors;
}
