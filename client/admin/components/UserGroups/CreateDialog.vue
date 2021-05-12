<template>
  <admin-dialog v-model="visible" header-icon="mdi-account-multiple-plus-outline">
    <template v-slot:activator="{ on }">
      <v-btn v-on="on" text>
        <v-icon dense class="mr-1">mdi-plus</v-icon>
        Create
      </v-btn>
    </template>
    <template v-slot:header>Create User Group</template>
    <template v-slot:body>
      <validation-observer
        v-if="visible"
        ref="form"
        @submit.prevent="$refs.form.handleSubmit(save)"
        tag="form"
        novalidate>
        <validation-provider
          v-slot="{ errors }"
          name="user group name"
          rules="required|min:2|max:50"
          outlined>
          <v-text-field
            v-model="userGroup.name"
            :error-messages="errors"
            label="User Group Name"
            outlined
            class="mb-3" />
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

const getDefaultData = () => ({ name: '' });

export default {
  name: 'user-group-dialog',
  data: () => ({
    visible: false,
    userGroup: getDefaultData()
  }),
  methods: {
    close() {
      this.visible = false;
    },
    save() {
      this.$emit('create', this.userGroup);
      this.close();
    }
  },
  watch: {
    visible(val) {
      if (!val) return;
      this.userGroup = getDefaultData();
    }
  },
  components: { AdminDialog }
};
</script>
