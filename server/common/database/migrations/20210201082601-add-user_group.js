'use strict';

const TABLE_NAME = 'user_group';

module.exports = {
  up: (qi, { DATE, INTEGER, STRING }) => qi.createTable(TABLE_NAME, {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    parentId: {
      type: INTEGER,
      field: 'parent_id',
      references: { model: 'user_group', key: 'id' }
    },
    name: {
      type: STRING
    },
    createdAt: {
      type: DATE,
      field: 'created_at',
      allowNull: false
    },
    updatedAt: {
      type: DATE,
      field: 'updated_at',
      allowNull: false
    },
    deletedAt: {
      type: DATE,
      field: 'deleted_at'
    }
  }),
  down: qi => qi.dropTable(TABLE_NAME)
};
