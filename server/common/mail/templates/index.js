'use strict';

const { paramCase } = require('change-case');
const cheerio = require('cheerio');
const createDataUri = require('create-data-uri');
const fileType = require('file-type');
const fs = require('fs');
const logger = require('../../logger')('mailer');
const mapKeys = require('lodash/mapKeys');
const map = require('lodash/map');
const mjml2html = require('mjml');
const path = require('path');
const pupa = require('pupa');

function renderTemplate(templatePath, params, style) {
  const template = fs.readFileSync(templatePath, 'utf8');
  const $ = cheerio.load(template, { xmlMode: true });
  const $style = $('mj-attributes');
  $style.append(getAttributes($, style));
  logger.debug({ style: dump($, $style) }, 'Style email using `mj-attributes`:');
  const $icon = $('.icon');
  const iconPath = $icon.attr('src');
  $icon.attr('src', getDataUri(iconPath));
  const output = pupa($.html(), params);
  return mjml2html(output, { minify: true }).html;
}

module.exports = renderTemplate;

function getAttributes($, style = {}) {
  return map(style, (declarations, name) => $('<mj-class>').attr({
    name,
    ...mapKeys(declarations, (_, key) => paramCase(key))
  }));
}

function getDataUri(imagePath) {
  const buf = fs.readFileSync(path.join(__dirname, imagePath));
  const { mime } = fileType(buf) || {};
  return createDataUri(mime, buf.toString('base64'));
}

function dump($, $style) {
  return $style.find('mj-class').get().reduce((acc, el) => {
    const { name, ...attrs } = $(el).attr();
    return Object.assign(acc, { [name]: attrs });
  }, {});
}
