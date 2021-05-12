<template>
  <v-row class="ma-4">
    <v-col sm="12" lg="6">
      <div class="d-flex justify-end mb-5">
        <v-btn @click="showConfirmationDialog = true" color="error" text>
          <v-icon dense class="mr-1">mdi-delete-outline</v-icon>
          Delete User Group
        </v-btn>
      </div>
      <validation-observer
        ref="form"
        @submit.prevent="$refs.form.handleSubmit(saveUserGroup)"
        tag="form"
        novalidate>
        <validation-provider
          v-slot="{ errors }"
          rules="required|min:2|max:50"
          name="user group name">
          <v-text-field
            v-model.trim="userGroupData.name"
            :disabled="!isEditing"
            :error-messages="errors"
            name="name"
            label="User group name"
            append-icon="mdi-pencil-outline" />
        </validation-provider>
        <div class="d-flex justify-end">
          <template v-if="isEditing">
            <v-btn @click="cancel" text>Cancel</v-btn>
            <v-btn type="submit" text>Save</v-btn>
          </template>
          <v-btn v-else @click="isEditing = true" text>Edit</v-btn>
        </div>
      </validation-observer>
    </v-col>
    <confirmation-dialog
      :visible.sync="showConfirmationDialog"
      :action="removeUserGroup"
      :message="confirmationMessage"
      heading="Delete user group" />
  </v-row>
</template>

<script>
import api from '@/admin/api/userGroup';
import cloneDeep from 'lodash/cloneDeep';
import ConfirmationDialog from '@/admin/components/common/ConfirmationDialog';

export default {
  name: 'user-group-settings',
  props: {
    userGroup: { type: Object, required: true }
  },
  data: () => ({
    userGroupData: null,
    isEditing: false,
    showConfirmationDialog: false
  }),
  computed: {
    confirmationMessage: vm => `Are you sure you want to delete "${vm.userGroup.name}"?`
  },
  methods: {
    async saveUserGroup() {
      await api.update(this.userGroupData);
      this.isEditing = false;
      this.$emit('hydrate');
    },
    async removeUserGroup() {
      await api.remove(this.userGroup);
      this.$router.push({ name: 'userGroups' });
    },
    cloneUserGroup() {
      this.userGroupData = cloneDeep(this.userGroup);
    },
    cancel() {
      this.$refs.form.reset();
      this.cloneUserGroup();
      this.isEditing = false;
    }
  },
  created() {
    this.cloneUserGroup();
  },
  components: { ConfirmationDialog }
};
</script>
