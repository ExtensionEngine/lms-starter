<template>
  <admin-dialog v-model="visible" header-icon="mdi-layers-plus">
    <template v-slot:activator="{ on }">
      <v-btn v-on="on" text>
        <v-icon dense class="mr-1">mdi-plus</v-icon>
        Create
      </v-btn>
    </template>
    <template v-slot:header>Create</template>
    <template v-slot:body>
      <validation-observer
        v-if="visible"
        ref="form"
        @submit.prevent="$refs.form.handleSubmit(save)"
        tag="form"
        novalidate>
        <validation-provider
          v-slot="{ errors }"
          :rules="{ required: true, min: 2, max: 255 }"
          name="name">
          <v-text-field
            v-model.trim="offering.name"
            :error-messages="errors"
            name="name"
            label="Name"
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
import api from '@/admin/api/program';

const getDefaultData = () => ({ name: '' });

export default {
  name: 'offering-dialog',
  data: () => ({
    visible: false,
    offering: getDefaultData()
  }),
  methods: {
    close() {
      this.visible = false;
    },
    save() {
      api.create(this.offering).then(() => this.$emit('created'));
      this.close();
    }
  },
  watch: {
    visible(val) {
      if (!val) return;
      this.offering = getDefaultData();
    }
  },
  components: { AdminDialog }
};
</script>
