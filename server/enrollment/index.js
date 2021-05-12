'use strict';

const ctrl = require('./enrollment.controller');
const router = require('express').Router();

router
  .get('/', ctrl.list)
  .post('/', ctrl.create)
  .delete('/:id', ctrl.destroy);

module.exports = {
  path: '/enrollments',
  router
};
