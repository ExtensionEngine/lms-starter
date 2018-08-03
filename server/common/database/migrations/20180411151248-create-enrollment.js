'use strict';

const TABLE_NAME = 'enrollment';

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable(TABLE_NAME, {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    studentId: {
      type: Sequelize.INTEGER,
      field: 'student_id',
      references: { model: 'user', key: 'id' },
      onDelete: 'NO ACTION',
      allowNull: false
    },
    programLevelId: {
      type: Sequelize.INTEGER,
      field: 'program_level_id',
      references: { model: 'program_level', key: 'id' },
      onDelete: 'NO ACTION',
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DATE,
      field: 'created_at',
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DATE,
      field: 'updated_at',
      allowNull: false
    },
    deletedAt: {
      type: Sequelize.DATE,
      field: 'deleted_at'
    }
  }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable(TABLE_NAME)
};