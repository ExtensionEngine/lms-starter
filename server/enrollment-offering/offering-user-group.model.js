'use strict';

const { Model } = require('sequelize');
const { restoreOrCreate } = require('../common/database/restore');

class OfferingUserGroup extends Model {
  static fields({ DATE, INTEGER }) {
    return {
      userGroupId: {
        type: INTEGER,
        field: 'user_group_id',
        primaryKey: true,
        unique: 'offering_user_group_pkey'
      },
      offeringId: {
        type: INTEGER,
        field: 'offering_id',
        primaryKey: true,
        unique: 'offering_user_group_pkey'
      },
      createdAt: {
        type: DATE,
        field: 'created_at'
      },
      updatedAt: {
        type: DATE,
        field: 'updated_at'
      },
      deletedAt: {
        type: DATE,
        field: 'deleted_at'
      }
    };
  }

  static associate({ EnrollmentOffering, UserGroup }) {
    this.belongsTo(UserGroup, {
      foreignKey: { name: 'userGroupId', field: 'user_group_id' }
    });
    this.belongsTo(EnrollmentOffering, {
      foreignKey: { name: 'offeringId', field: 'offering_id' }
    });
  }

  static options() {
    return {
      modelName: 'offeringUserGroup',
      tableName: 'offering_user_group',
      underscored: true,
      timestamps: true,
      paranoid: true,
      freezeTableName: true
    };
  }

  static async restoreOrCreate(offeringUserGroup, options) {
    return restoreOrCreate(this, offeringUserGroup, options);
  }
}

module.exports = OfferingUserGroup;
