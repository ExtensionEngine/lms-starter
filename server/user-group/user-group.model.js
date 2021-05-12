'use strict';

const find = require('lodash/find');
const { Model } = require('sequelize');
const Promise = require('bluebird');
const { restoreOrCreate } = require('../common/database/restore');

class UserGroup extends Model {
  static fields({ DATE, STRING }) {
    return {
      name: {
        type: STRING
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

  static associate(opts) {
    const { EnrollmentOffering, OfferingUserGroup, User, UserGroupMembership } = opts;
    this.belongsToMany(User, {
      as: 'members',
      through: UserGroupMembership,
      foreignKey: { name: 'userGroupId', field: 'user_group_id' }
    });
    this.belongsToMany(EnrollmentOffering, {
      through: OfferingUserGroup,
      foreignKey: { name: 'userGroupId', field: 'user_group_id' }
    });
    this.belongsTo(this, {
      as: 'parent',
      foreignKey: { name: 'parentId', field: 'parent_id' }
    });
    this.hasMany(this, {
      as: 'children',
      foreignKey: { name: 'parentId', field: 'parent_id' }
    });
  }

  static options() {
    return {
      modelName: 'userGroup',
      tableName: 'user_group',
      underscored: true,
      timestamps: true,
      paranoid: true,
      freezeTableName: true
    };
  }

  static async restoreOrCreate(userGroup, options) {
    return restoreOrCreate(this, userGroup, options);
  }

  static async hasAncestorInstructor(user, currentItem, items = [currentItem]) {
    const parent = await this.getParent(currentItem);
    if (!parent) return;
    items.push(parent);
    const { userGroupMembership } = find(parent.members, { id: user.id }) || {};
    const isUserInstructor = userGroupMembership && userGroupMembership.isInstructor();
    return isUserInstructor || this.hasAncestorInstructor(user, parent, items);
  }

  static getParent({ parentId }) {
    const attributes = ['id', 'parentId'];
    const User = this.sequelize.model('User');
    const include = [{ model: User, as: 'members', attributes: ['id'] }];
    return this.findByPk(parentId, { attributes, include });
  }

  static getChildren(parentId, options = {}) {
    const attributes = ['id', 'parentId'];
    const User = this.sequelize.model('User');
    const include = [{ model: User, as: 'members', attributes: ['id'] }];
    const where = { parentId };
    return this.findAll({ where, attributes, include, ...options });
  }

  async getDescendants(options, item = this) {
    const children = await UserGroup.getChildren(item.id, options);
    if (!children.length) return [];
    const descendants = await Promise.reduce(children, async (acc, it) => {
      return acc.concat(await this.getDescendants(options, it));
    }, []);
    return children.concat(descendants);
  }

  async remove() {
    const transaction = await this.sequelize.transaction();
    const descendantIds = await this.getDescendants(transaction).map(it => it.id);
    const where = { id: [this.id, ...descendantIds] };
    await UserGroup.destroy({ where });
    return transaction.commit();
  }
}

module.exports = UserGroup;
