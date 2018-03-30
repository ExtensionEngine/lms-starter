const createError = require('http-errors');
const find = require('lodash/find');
const HttpStatus = require('http-status');
const toInteger = require('lodash/toInteger');

// TODO: Use data from database!
const courses = [{
  id: 42,
  name: 'Example course: A'
}, {
  id: 43,
  name: 'Example course: B'
}];

function index(req, res) {
  res.jsend.success(courses);
}

function get(req, res, next) {
  const id = toInteger(req.params.id);
  const course = find(courses, { id });
  if (course) return res.jsend.success(course);
  next(createError(HttpStatus.NOT_FOUND, 'Course not found'));
}

module.exports = {
  index,
  get
};
