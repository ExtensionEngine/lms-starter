'use strict';

const config = require('../config');
const { createError } = require('../common/errors');
const createStorage = require('../common/storage');
const forEach = require('lodash/forEach');
const HttpStatus = require('http-status');
const pick = require('lodash/pick');

const { NOT_FOUND } = HttpStatus;
const Storage = createStorage(config.storage);
const excludeCorrect = data => forEach(data, it => delete it.data.correct);

function list({ cohort, query: { includeStructure } }, res) {
  const attributes = ['id', 'schema', 'name', 'description', 'publishedAt'];
  if (includeStructure) attributes.push('structure');
  return cohort.getContentRepos({ attributes })
    .then(repos => res.jsend.success(repos));
}

function get({ repo }, res) {
  const attributes =
    ['id', 'schema', 'name', 'description', 'structure', 'publishedAt'];
  return res.jsend.success(pick(repo, attributes));
}

function getContainer({ cohort, params, repo }, res) {
  return Storage.getContainer(repo.sourceId, params.containerId, cohort.id)
    .catch(() => createError(NOT_FOUND, 'Not found!'))
    .then(container => res.jsend.success(container));
}

function getExam({ cohort, params, repo }, res) {
  return Storage.getExam(repo.sourceId, params.examId, cohort.id)
    .catch(() => createError(NOT_FOUND, 'Not found!'))
    .then(exam => {
      forEach(exam.groups, group => excludeCorrect(group.assessments));
      return res.jsend.success(exam);
    });
}

function getAssessments({ cohort, params, repo }, res) {
  return Storage.getAssessments(repo.sourceId, params.assessmentsId, cohort.id)
    .catch(() => createError(NOT_FOUND, 'Not found!'))
    .then(assessments => res.jsend.success(excludeCorrect(assessments)));
}

module.exports = {
  list,
  get,
  getContainer,
  getExam,
  getAssessments
};