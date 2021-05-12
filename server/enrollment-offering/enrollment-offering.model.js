'use strict';

const { Model } = require('sequelize');

class EnrollmentOffering extends Model {
  static fields({ DATE }) {
    return {
      createdAt: {
        type: DATE,
        allowNull: false,
        field: 'created_at'
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        field: 'updated_at'
      },
      deletedAt: {
        type: DATE,
        field: 'deleted_at'
      }
    };
  }

  static associate({ ContentRepo, Enrollment, Program, UserGroup, OfferingUserGroup }) {
    this.belongsTo(Program, {
      foreignKey: { name: 'programId', field: 'program_id' }
    });
    this.belongsTo(ContentRepo, {
      as: 'repository',
      foreignKey: { name: 'repositoryId', field: 'repository_id' }
    });
    this.hasMany(Enrollment, {
      foreignKey: { name: 'offeringId', field: 'enrollment_offering_id' }
    });
    this.belongsToMany(UserGroup, {
      through: OfferingUserGroup,
      foreignKey: { name: 'userGroupId', field: 'user_group_id' }
    });
  }

  static options() {
    return {
      modelName: 'enrollmentOffering',
      tableName: 'enrollment_offering',
      timestamps: true,
      paranoid: true,
      freezeTableName: true
    };
  }
}

module.exports = EnrollmentOffering;
