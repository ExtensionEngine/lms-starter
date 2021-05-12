<template>
  <admin-dialog
    v-model="show"
    @click:outside="close"
    header-icon="mdi-account-multiple-plus-outline">
    <template v-slot:header>
      {{ subGroupData ? 'Edit' : 'Create' }} Sub Group
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
          name="user sub group name"
          rules="required|min:2|max:50"
          outlined>
          <v-text-field
            v-model="subGroup.name"
            :error-messages="errors"
            label="User Sub Group Name"
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
import api from '@/admin/api/userGroup';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';

const resetSubGroup = () => ({ name: '' });

export default {
  name: 'sub-group-dialog',
  props: {
    visible: { type: Boolean, default: false },
    parentId: { type: Number, required: true },
    subGroupData: { type: Object, default: () => ({}) }
  },
  data: () => ({
    subGroup: resetSubGroup(),
    isLoading: false
  }),
  computed: {
    show: {
      get: vm => vm.visible,
      set(value) {
        if (!value) this.close();
      }
    },
    isNewSubGroup: vm => !vm.subGroup.id
  },
  methods: {
    close() {
      this.subGroup = resetSubGroup();
      this.$emit('update:visible', false);
    },
    async save() {
      const { subGroup, parentId, isNewSubGroup } = this;
      const action = isNewSubGroup ? 'create' : 'update';
      await api[action]({ ...subGroup, parentId });
      this.$emit(`${action}d`);
      this.close();
    }
  },
  watch: {
    show(val) {
      const { subGroupData } = this;
      if (!val || isEmpty(subGroupData)) return;
      this.subGroup = cloneDeep(subGroupData);
    }
  },
  components: { AdminDialog }
};
</script>
