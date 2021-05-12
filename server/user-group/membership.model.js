'use strict';

const { Model } = require('sequelize');
const { restoreOrCreate } = require('../common/database/restore');
const { UserGroupRole } = require('../../common/config');

class UserGroupMembership extends Model {
  static fields({ DATE, ENUM, INTEGER }) {
    return {
      userId: {
        type: INTEGER,
        field: 'user_id',
        primaryKey: true,
        unique: 'user_group_membership_pkey'
      },
      userGroupId: {
        type: INTEGER,
        field: 'user_group_id',
        primaryKey: true,
        unique: 'user_group_membership_pkey'
      },
      role: {
        type: ENUM(Object.values(UserGroupRole))
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

  static associate({ User, UserGroup }) {
    this.belongsTo(User, {
      foreignKey: { name: 'userId', field: 'user_id' }
    });
    this.belongsTo(UserGroup, {
      foreignKey: { name: 'userGroupId', field: 'user_group_id' }
    });
  }

  static options() {
    return {
      modelName: 'userGroupMembership',
      tableName: 'user_group_membership',
      underscored: true,
      timestamps: true,
      paranoid: true,
      freezeTableName: true
    };
  }

  static scopes({ User }) {
    return {
      user: options => ({ include: { model: User, ...options } })
    };
  }

  static withUser(options = {}) {
    const defaultAttrs = ['id', 'email', 'firstName', 'lastName', 'fullName', 'label'];
    if (!options.attributes) options.attributes = defaultAttrs;
    return this.scope({ method: ['user', options] });
  }

  static async restoreOrCreate(userGroupMembership, options) {
    return restoreOrCreate(this, userGroupMembership, options);
  }

  isInstructor() {
    return this.role === UserGroupRole.INSTRUCTOR;
  }
}

module.exports = UserGroupMembership;
