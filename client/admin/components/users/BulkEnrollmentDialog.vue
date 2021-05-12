<template>
  <admin-dialog
    v-model="visible"
    @click:outside="close"
    header-icon="mdi-school">
    <template v-slot:activator="{ on }">
      <v-btn v-on="on" :disabled="!users.length" text>
        <v-icon dense class="mr-1">mdi-school</v-icon>
        Enroll selected
      </v-btn>
    </template>
    <template v-slot:header>Enroll users</template>
    <template v-slot:body>
      <validation-observer
        ref="form"
        @submit.prevent="$refs.form.handleSubmit(submit)"
        tag="form"
        novalidate>
        <validation-provider
          v-slot="{ errors }"
          name="program">
          <v-autocomplete
            v-model="selectedProgramId"
            :items="programOptions"
            :disabled="enrolling"
            :error-messages="errors"
            name="program"
            label="Program"
            placeholder="Start typing to search"
            prepend-icon="mdi-magnify"
            clearable />
        </validation-provider>
        <div class="d-flex justify-end my-2">
          <v-btn @click="close" :disabled="enrolling" text>Cancel</v-btn>
          <v-btn
            :disabled="enrollDisabled"
            :loading="enrolling"
            type="submit"
            text>
            Enroll
          </v-btn>
        </div>
      </validation-observer>
    </template>
  </admin-dialog>
</template>

<script>
import AdminDialog from '@/admin/components/common/Dialog';
import enrollmentApi from '@/admin/api/enrollment';
import map from 'lodash/map';
import programApi from '@/admin/api/program';

export default {
  name: 'bulk-enrollment-dialog',
  props: {
    users: { type: Array, default: () => [] }
  },
  data: () => ({
    visible: false,
    selectedProgramId: null,
    programs: [],
    enrolling: false
  }),
  computed: {
    programOptions: vm => map(vm.programs, it => ({ value: it.id, text: it.name })),
    enrollDisabled: vm => !vm.selectedProgramId || vm.enrolling
  },
  methods: {
    async fetch() {
      const { items } = await programApi.fetch();
      this.programs = items;
    },
    submit() {
      this.enrolling = true;
      const { users, selectedProgramId: programId } = this;
      return enrollmentApi.create({ learnerId: map(users, 'id'), programId })
        .then(({ failed = [] }) => {
          if (failed.length <= 0) return this.close();
          const msg = `Enrolling failed for ${failed.length} users`;
          this.$refs.form.setErrors({ program: [msg] });
        })
        .catch(error => {
          const msg = 'Error! Unable to enroll users!';
          this.$refs.form.setErrors({ program: [msg] });
          return Promise.reject(error);
        })
        .finally(() => (this.enrolling = false));
    },
    close() {
      this.visible = false;
      this.selectedProgramId = null;
      this.$refs.form.reset();
    }
  },
  watch: {
    visible: async function (val) {
      if (val) this.fetch();
    }
  },
  components: { AdminDialog }
};
</script>
