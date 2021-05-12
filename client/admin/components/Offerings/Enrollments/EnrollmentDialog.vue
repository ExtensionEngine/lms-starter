<template>
  <admin-dialog v-model="isVisible" @click:outside="close" header-icon="mdi-school">
    <template v-slot:activator="{ on }">
      <v-btn v-on="on" text>
        <v-icon dense class="mr-1">mdi-school</v-icon>
        Enroll learner
      </v-btn>
    </template>
    <template v-slot:header>Enroll Learner</template>
    <template v-slot:body>
      <validation-observer
        v-if="isVisible"
        ref="form"
        @submit.prevent="$refs.form.handleSubmit(enroll)"
        tag="form"
        novalidate>
        <validation-provider
          v-slot="{ errors }"
          :rules="{ required: true, unique_enrollment: { learnerId, offeringId } }"
          name="learner">
          <user-select
            v-model="learner"
            :params="{ role: 'LEARNER' }"
            :error-messages="errors"
            label="Learner"
            append-icon="mdi-magnify"
            clearable outlined
            class="mb-1" />
        </validation-provider>
        <div class="d-flex justify-end">
          <v-btn @click="close" text>Cancel</v-btn>
          <v-btn type="submit" text>Enroll</v-btn>
        </div>
      </validation-observer>
    </template>
  </admin-dialog>
</template>

<script>
import AdminDialog from '@/admin/components/common/Dialog';
import enrollmentApi from '@/admin/api/enrollment';
import pick from 'lodash/pick';
import UserSelect from '@/admin/components/common/UserSelect';

export default {
  name: 'enrollment-dialog',
  props: {
    offeringId: { type: Number, required: true }
  },
  data: () => ({
    isVisible: false,
    learner: null,
    isLoading: false
  }),
  computed: {
    learnerId: vm => vm.learner?.id
  },
  methods: {
    async enroll() {
      const params = pick(this, ['learnerId', 'offeringId']);
      await enrollmentApi.create(params);
      this.close();
      this.$emit('enrolled');
    },
    close() {
      this.isVisible = false;
      this.learner = null;
    }
  },
  components: { AdminDialog, UserSelect }
};
</script>
