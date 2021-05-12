'use strict';

const { ContentRepo, EnrollmentOffering, Program, Sequelize } = require('../common/database');

const { Op } = Sequelize;

async function list({ query, options }, res) {
  const { filter, name } = query;
  const include = [
    { model: Program, as: 'program' },
    { model: ContentRepo, as: 'repository' }
  ];
  if (name || filter) {
    const cond = name ? name.trim() : `%${filter.trim()}%`;
    include[0].where = { name: { [Op.iLike]: cond } };
  }
  const opts = { include, ...options };
  const { rows, count } = await EnrollmentOffering.findAndCountAll(opts);
  return res.jsend.success({ items: rows, total: count });
}

module.exports = {
  list
};
