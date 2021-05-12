<template>
  <admin-dialog v-model="show" header-icon="mdi-account-plus-outline">
    <template v-slot:header>
      {{ userData ? 'Edit' : 'Create' }} User
    </template>
    <template v-slot:body>
      <div class="d-flex justify-end mb-5">
        <v-btn
          v-if="!isNewUser"
          @click="invite"
          :disabled="isLoading"
          :loading="isLoading"
          color="primary"
          text>
          Reinvite
        </v-btn>
      </div>
      <validation-observer
        v-if="show"
        ref="form"
        @submit.prevent="$refs.form.handleSubmit(save)"
        tag="form"
        novalidate>
        <validation-provider
          v-slot="{ errors }"
          :rules="{ required: true, email: true, unique_email: userData }"
          name="email">
          <v-text-field
            v-model="user.email"
            :error-messages="errors"
            name="email"
            label="Email"
            placeholder="Email"
            outlined />
        </validation-provider>
        <validation-provider
          v-slot="{ errors }"
          name="role"
          rules="required">
          <v-select
            v-model="user.role"
            :items="roles"
            :error-messages="errors"
            name="role"
            label="Role"
            placeholder="Role"
            outlined />
        </validation-provider>
        <validation-provider
          v-slot="{ errors }"
          name="first name"
          rules="required|alpha|min:2|max:50">
          <v-text-field
            v-model="user.firstName"
            :error-messages="errors"
            label="First Name"
            placeholder="First Name"
            outlined />
        </validation-provider>
        <validation-provider
          v-slot="{ errors }"
          name="last name"
          rules="required|alpha|min:2|max:50">
          <v-text-field
            v-model="user.lastName"
            :error-messages="errors"
            label="Last Name"
            placeholder="Last Name"
            outlined />
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
import api from '@/admin/api/user';
import cloneDeep from 'lodash/cloneDeep';
import humanize from 'humanize-string';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import { Role } from '@/../common/config';

const resetUser = () => ({
  firstName: '',
  lastName: '',
  email: '',
  role: null
});

export default {
  name: 'user-dialog',
  props: {
    visible: { type: Boolean, default: false },
    userData: { type: Object, default: () => ({}) }
  },
  data: () => ({
    user: resetUser(),
    isLoading: false
  }),
  computed: {
    show: {
      get: vm => vm.visible,
      set(value) {
        if (!value) this.close();
      }
    },
    roles: () => map(Role, it => ({ text: humanize(it), value: it })),
    isNewUser: vm => !vm.user.id
  },
  methods: {
    close() {
      this.user = resetUser();
      this.$emit('update:visible', false);
    },
    save() {
      const action = this.isNewUser ? 'create' : 'update';
      api[action](this.user).then(() => this.$emit(`${action}d`));
      this.close();
    },
    invite() {
      this.isLoading = true;
      api.invite(this.user).finally(() => (this.isLoading = false));
    }
  },
  watch: {
    show(val) {
      const { userData } = this;
      if (!val || isEmpty(userData)) return;
      this.user = cloneDeep(userData);
    }
  },
  components: {
    AdminDialog
  }
};
</script>
