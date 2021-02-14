'use strict';

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const history = require('connect-history-api-fallback');
const jsend = require('jsend').middleware;
const morgan = require('morgan');
const nocache = require('nocache');
// eslint-disable-next-line require-sort/require-sort
require('express-async-errors');

/* eslint-disable require-sort/require-sort */
const {
  apiErrorHandler,
  globalErrorHandler,
  notFoundRouteHandler
} = require('./common/errors');
const auth = require('./common/auth');
const config = require('./config');
const origin = require('./common/origin');
const router = require('./router');
/* eslint-enable */

const app = express();
app.use(helmet());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  preflightContinue: true
}));
app.use(bodyParser.json({ limit: config.uploadLimit }));
app.use(auth.initialize());
app.use(origin());

const staticMiddleware = express.static(config.staticFolder);
app.use(staticMiddleware);
app.use(jsend);

// Log http requests
const isSuccessful = res => res.statusCode >= 200 && res.statusCode < 300;
const format = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(format, {
  skip: (_req, res) => isSuccessful(res),
  stream: process.stderr
}));
app.use(morgan(format, {
  skip: (_req, res) => !isSuccessful(res),
  stream: process.stdout
}));

// Mount main router
app.use(
  config.apiPath,
  nocache(),
  router,
  notFoundRouteHandler,
  apiErrorHandler
);

if (config.useHistoryApiFallback) {
  app.use(history(config.historyApiFallbackOptions), staticMiddleware);
}

app.use(globalErrorHandler);

module.exports = app;
