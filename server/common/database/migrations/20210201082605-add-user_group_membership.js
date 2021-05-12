'use strict';

const TABLE_NAME = 'user_group_membership';

exports.up = async (qi, { DATE, ENUM, INTEGER }) => {
  await qi.createTable(TABLE_NAME, {
    userId: {
      type: INTEGER,
      field: 'user_id',
      references: { model: 'user', key: 'id' },
      allowNull: false
    },
    userGroupId: {
      type: INTEGER,
      field: 'user_group_id',
      references: { model: 'user_group', key: 'id' },
      allowNull: false
    },
    role: {
      type: ENUM('INSTRUCTOR', 'LEARNER')
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
  });
  return addConstraints(qi);
};

exports.down = qi => qi.dropTable(TABLE_NAME);

async function addConstraints(queryInterface) {
  const table = await queryInterface.describeTable(TABLE_NAME);
  if (table.user_group_id.primaryKey && table.user_id.primaryKey) return;
  const fields = ['user_group_id', 'user_id'];
  const options = { type: 'primary key', name: 'user_group_membership_pkey', fields };
  return queryInterface.addConstraint(TABLE_NAME, options);
}
