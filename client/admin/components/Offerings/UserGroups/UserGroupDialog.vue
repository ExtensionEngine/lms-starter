<template>
  <admin-dialog
    v-model="isVisible"
    @click:outside="close"
    header-icon="mdi-account-multiple-plus-outline">
    <template v-slot:activator="{ on }">
      <v-btn v-on="on" text>
        <v-icon dense class="mr-1">mdi-plus</v-icon>
        Add user group
      </v-btn>
    </template>
    <template v-slot:header>Add User Group</template>
    <template v-slot:body>
      <validation-observer
        v-if="isVisible"
        ref="form"
        @submit.prevent="$refs.form.handleSubmit(add)"
        tag="form"
        novalidate>
        <validation-provider
          v-slot="{ errors }"
          rules="required"
          name="user group">
          <user-group-select
            v-model="userGroup"
            :params="{ userGroupIds, fetchAll: true }"
            :error-messages="errors"
            label="User Group"
            append-icon="mdi-magnify"
            clearable outlined
            class="mb-1" />
        </validation-provider>
        <div class="d-flex justify-end">
          <v-btn @click="close" text>Cancel</v-btn>
          <v-btn type="submit" text>Add</v-btn>
        </div>
      </validation-observer>
    </template>
  </admin-dialog>
</template>

<script>
import AdminDialog from '@/admin/components/common/Dialog';
import offeringApi from '@/admin/api/offering';
import UserGroupSelect from '@/admin/components/common/UserGroupSelect';

export default {
  name: 'user-group-dialog',
  props: {
    offeringId: { type: Number, required: true },
    userGroupIds: { type: Array, default: () => [] }
  },
  data: () => ({
    isVisible: false,
    userGroup: null,
    isLoading: false
  }),
  methods: {
    async add() {
      const { offeringId, userGroup } = this;
      const params = { offeringId, userGroupId: userGroup.id };
      await offeringApi.addUserGroup(params);
      this.$emit('added');
      this.close();
    },
    close() {
      this.isVisible = false;
      this.userGroup = null;
    }
  },
  components: { AdminDialog, UserGroupSelect }
};
</script>
