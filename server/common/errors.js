'use strict';

const { INTERNAL_SERVER_ERROR, NOT_FOUND } = require('http-status');
const AuthError = require('passport/lib/errors/authenticationerror');
const httpError = require('http-errors');
const logger = require('./logger')();
const path = require('path');

function createError(code = 400, message = 'An error has occured') {
  return Promise.reject(httpError(code, message, { custom: true }));
}

const notFoundRouteHandler = (req, res, _next) =>
  res.status(NOT_FOUND).jsend.error({ message: `Route ${req.originalUrl} not found.` });

const apiErrorHandler = (err, _req, res, next) => {
  if (err) {
    res.status(err.status || INTERNAL_SERVER_ERROR).jsend.error(err.message);
    return;
  }
  next();
};

const globalErrorHandler = (err, req, res, _next) => {
  if ((err instanceof httpError.HttpError) || (err instanceof AuthError)) {
    res.status(err.status).jsend.error(err.message);
    return;
  }
  res.status(INTERNAL_SERVER_ERROR);
  res.sendFile(path.join(__dirname, '/../500.html'));
  logger.error({ req, err }, '🚨  Internal Error:', err.message);
};

module.exports = {
  createError,
  notFoundRouteHandler,
  apiErrorHandler,
  globalErrorHandler
};
