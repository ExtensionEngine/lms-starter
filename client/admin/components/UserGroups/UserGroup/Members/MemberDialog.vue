<template>
  <admin-dialog
    v-model="show"
    @click:outside="close"
    header-icon="mdi-account-plus-outline">
    <template v-slot:header>
      {{ memberData ? 'Edit' : 'Add' }} Member
    </template>
    <template v-slot:body>
      <validation-observer
        v-if="show"
        ref="form"
        @submit.prevent="$refs.form.handleSubmit(save)"
        tag="form"
        novalidate>
        <validation-provider
          v-slot="{ errors }"
          name="role"
          rules="required">
          <v-select
            v-model="member.role"
            :items="roles"
            :error-messages="errors"
            name="role"
            label="Role"
            outlined />
        </validation-provider>
        <validation-provider
          v-if="isNewMember"
          v-slot="{ errors }"
          name="user"
          rules="required">
          <user-select
            v-model="member.user"
            :params="{ userIds }"
            :error-messages="errors"
            label="User"
            append-icon="mdi-magnify"
            clearable outlined
            class="mb-1" />
        </validation-provider>
        <div class="d-flex justify-end mb-2">
          <v-btn @click="close" text>Cancel</v-btn>
          <v-btn type="submit" text>Save</v-btn>
        </div>
      </validation-observer>
    </template>
  </admin-dialog>
</template>

<script>
import AdminDialog from '@/admin/components/common/Dialog';
import api from '@/admin/api/userGroupMember';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import UserSelect from '@/admin/components/common/UserSelect';

const resetMember = () => ({
  user: null,
  role: null
});

export default {
  name: 'member-dialog',
  props: {
    visible: { type: Boolean, default: false },
    memberData: { type: Object, default: () => ({}) },
    userGroupId: { type: Number, required: true },
    userIds: { type: Array, default: () => [] },
    roles: { type: Array, required: true }
  },
  data: () => ({
    member: resetMember(),
    isLoading: false
  }),
  computed: {
    show: {
      get: vm => vm.visible,
      set(value) {
        if (!value) this.close();
      }
    },
    isNewMember: vm => !vm.member.userId
  },
  methods: {
    close() {
      this.member = resetMember();
      this.$emit('update:visible', false);
    },
    async save() {
      const { member, userGroupId, isNewMember } = this;
      const action = isNewMember ? 'create' : 'update';
      await api[action]({ ...member, userGroupId });
      this.$emit(`${action}d`);
      this.close();
    }
  },
  watch: {
    show(val) {
      const { memberData } = this;
      if (!val || isEmpty(memberData)) return;
      this.member = cloneDeep(memberData);
    }
  },
  components: { AdminDialog, UserSelect }
};
</script>
