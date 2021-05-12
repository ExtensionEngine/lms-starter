'use strict';

const TABLE_NAME = 'offering_user_group';

exports.up = async (qi, { DATE, INTEGER }) => {
  await qi.createTable(TABLE_NAME, {
    userGroupId: {
      type: INTEGER,
      field: 'user_group_id',
      references: { model: 'user_group', key: 'id' },
      allowNull: false
    },
    offeringId: {
      type: INTEGER,
      field: 'offering_id',
      references: { model: 'enrollment_offering', key: 'id' },
      allowNull: false
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
  if (table.user_group_id.primaryKey && table.offering_id.primaryKey) return;
  const fields = ['user_group_id', 'offering_id'];
  const options = { type: 'primary key', name: 'offering_user_group_pkey', fields };
  return queryInterface.addConstraint(TABLE_NAME, options);
}
