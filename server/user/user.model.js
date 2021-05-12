'use strict';

const { Model, Op, Sequelize } = require('sequelize');
const { restoreOrCreate, restoreOrCreateAll } = require('../common/database/restore');
const Audience = require('../common/auth/audience');
const bcrypt = require('bcrypt');
const compact = require('lodash/compact');
const config = require('../config');
const IntervalCache = require('../common/util/interval-cache');
const jwt = require('jsonwebtoken');
const mail = require('../common/mail');
const map = require('lodash/map');
const pick = require('lodash/pick');
const Promise = require('bluebird');
const { Role } = require('../../common/config');
const { sql } = require('../common/database/helpers');
const values = require('lodash/values');
const logger = require('../common/logger')();

const PROFILE_ATTRS = [
  'id', 'firstName', 'lastName', 'email',
  'role', 'createdAt', 'lastActive', 'deletedAt',
  'fullName', 'label'
];

const activityLookup = new IntervalCache(config.userActivity);
Object.values(IntervalCache.Events).forEach(event => {
  activityLookup.on(event, (id, date) => User.updateActivity(id, date));
});

class User extends Model {
  static fields({ DATE, ENUM, STRING, VIRTUAL }) {
    return {
      email: {
        type: STRING,
        allowNull: false,
        validate: { isEmail: true, notEmpty: true },
        unique: { msg: 'This email address is already in use.' }
      },
      password: {
        type: STRING,
        validate: { notEmpty: true, len: [5, 255] }
      },
      role: {
        type: ENUM(values(Role)),
        allowNull: false,
        defaultValue: Role.LEARNER
      },
      token: {
        type: STRING,
        validate: { notEmpty: true, len: [10, 500] }
      },
      firstName: {
        type: STRING,
        field: 'first_name'
      },
      lastName: {
        type: STRING,
        field: 'last_name'
      },
      fullName: {
        type: VIRTUAL,
        get() {
          return compact([this.firstName, this.lastName]).join(' ') || null;
        }
      },
      label: {
        type: VIRTUAL,
        get() {
          return this.fullName || this.email;
        }
      },
      lastActive: {
        type: DATE,
        field: 'last_active'
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
      },
      profile: {
        type: VIRTUAL,
        get() {
          const profile = pick(this, PROFILE_ATTRS);
          const lastActive = activityLookup.get(this.id);
          if (lastActive) profile.lastActive = lastActive;
          return profile;
        }
      }
    };
  }

  static get text() {
    return sql.concat(
      Sequelize.col('email'),
      Sequelize.col('first_name'),
      Sequelize.col('last_name'),
      { separator: ' ' }
    );
  }

  static associate({ Enrollment, UserGroup, UserGroupMembership }) {
    this.hasMany(Enrollment, {
      foreignKey: { name: 'learnerId', field: 'learner_id' }
    });
    this.belongsToMany(UserGroup, {
      through: UserGroupMembership,
      foreignKey: { name: 'userId', field: 'user_id' }
    });
  }

  static options() {
    return {
      modelName: 'user',
      timestamps: true,
      paranoid: true,
      freezeTableName: true
    };
  }

  static hooks({ beforeCreate, beforeBulkCreate, beforeUpdate, beforeDestroy }) {
    return {
      [beforeCreate]: user => user.encryptPassword(),
      [beforeBulkCreate]: users => Promise.map(users, user => user.encryptPassword()),
      [beforeDestroy]: user => activityLookup.clear(user.id, { silent: true }),
      [beforeUpdate](user) {
        return user.changed('password')
          ? user.encryptPassword()
          : Promise.resolve(user);
      }
    };
  }

  static scopes() {
    return {
      searchByPattern(pattern) {
        const cond = { [Op.iLike]: `%${pattern}%` };
        const where = sql.where(this.text, cond, { scope: true });
        return { where };
      }
    };
  }

  static match(pattern) {
    if (!pattern) return User;
    return User.scope({ method: ['searchByPattern', pattern] });
  }

  static async invite(user, options) {
    user.token = user.createToken({
      audience: Audience.Scope.Setup,
      expiresIn: '5 days'
    });
    mail.invite(user, options).catch(err =>
      logger.error('Error: Sending invite email failed:', err.message));
    return user.save({ paranoid: false });
  }

  static async restoreOrCreate(user, options) {
    return restoreOrCreate(this, user, options);
  }

  static async restoreOrCreateAll(users, options) {
    const where = { email: map(users, 'email') };
    return restoreOrCreateAll(this, users, where, options);
  }

  static updateActivity(id, lastActive) {
    return this.update({ lastActive }, { where: { id } });
  }

  static stopActivityLog(userId) {
    activityLookup.clear(userId);
  }

  logActivity() {
    activityLookup.set(this.id, new Date());
    return this;
  }

  async encryptPassword() {
    if (!this.password) return;
    this.password = await bcrypt.hash(this.password, config.auth.saltRounds);
    return this;
  }

  async authenticate(password) {
    const result = await bcrypt.compare(password, this.password);
    return result && this;
  }

  sendResetToken(options) {
    this.token = this.createToken({
      audience: Audience.Scope.Setup,
      expiresIn: '5 days'
    });
    mail.resetPassword(this, options).catch(err =>
      logger.error('Error: Sending reset password email failed:', err.message));
    return this.save();
  }

  createToken(options = {}) {
    const payload = pick(this, ['id', 'email']);
    return jwt.sign(payload, config.auth.secret, options);
  }

  isAdmin() {
    return this.role === Role.ADMIN;
  }
}

module.exports = User;
