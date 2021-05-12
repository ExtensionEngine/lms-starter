<template>
  <admin-dialog
    v-model="visible"
    @click:outside="close"
    width="600"
    header-icon="mdi-cloud-upload">
    <template v-slot:activator="{ on }">
      <v-btn v-on="on" color="primary" text>
        <v-icon dense class="mr-1">mdi-cloud-upload</v-icon>Import users
      </v-btn>
    </template>
    <template v-slot:header>Import Users</template>
    <template v-slot:body>
      <validation-observer
        v-if="visible"
        ref="form"
        v-slot="{ invalid }"
        @submit.prevent="$refs.form.handleSubmit(submit)"
        tag="form"
        novalidate>
        <validation-provider
          v-slot="{ errors }"
          :rules="inputValidation"
          name="file"
          slim>
          <v-file-input
            v-model="file"
            :accept="acceptedFiles"
            :error-messages="errors"
            :disabled="importing"
            prepend-icon="mdi-attachment"
            label="Upload .xlsx or .csv file" />
        </validation-provider>
        <div class="d-flex my-2">
          <v-btn @click="downloadTemplateFile" color="primary" text>
            Download Template
          </v-btn>
          <v-spacer />
          <v-fade-transition>
            <v-btn
              v-show="serverErrorsReport"
              @click="downloadErrorsFile"
              color="error"
              text>
              <v-icon class="mr-1">mdi-cloud-download</v-icon>Errors
            </v-btn>
          </v-fade-transition>
          <v-btn @click="close" text>Cancel</v-btn>
          <v-btn :disabled="invalid" :loading="importing" type="submit" text>
            Import
          </v-btn>
        </div>
      </validation-observer>
    </template>
  </admin-dialog>
</template>

<script>
import AdminDialog from '@/admin/components/common/Dialog';
import api from '@/admin/api/user';
import saveAs from 'save-as';

const inputFormats = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/csv': 'csv'
};

export default {
  name: 'import-dialog',
  data: () => ({
    visible: false,
    importing: false,
    file: null,
    form: null,
    serverErrorsReport: null
  }),
  computed: {
    inputValidation: () => ({ required: true, mimes: Object.keys(inputFormats) }),
    acceptedFiles: () => Object.keys(inputFormats)
  },
  methods: {
    close() {
      if (this.importing) return;
      this.file = null;
      this.serverErrorsReport = null;
      this.visible = false;
    },
    submit() {
      this.importing = true;
      const { file } = this;
      this.form = new FormData();
      this.form.append('file', file, file.name);
      return api.bulkImport(this.form).then(({ data, count }) => {
        this.importing = false;
        if (count) this.$emit('imported');
        if (!data.size) return this.close();
        const message = `${count} users were successfully imported.`;
        this.$refs.form.setErrors({ file: [message] });
        this.serverErrorsReport = data;
      }).catch(err => {
        this.importing = false;
        const message = 'Importing users failed.';
        this.$refs.form.setErrors({ file: [message] });
        return Promise.reject(err);
      });
    },
    downloadErrorsFile() {
      const extension = inputFormats[this.serverErrorsReport.type];
      saveAs(this.serverErrorsReport, `Errors.${extension}`);
    },
    async downloadTemplateFile() {
      const { data } = await api.getImportTemplate();
      saveAs(data, `Template.${inputFormats[data.type]}`);
    }
  },
  components: { AdminDialog }
};
</script>

<style lang="scss" scoped>
.v-form input {
  display: none;
}

.v-text-field ::v-deep {
  .v-text-field__slot {
    cursor: pointer;

    input {
      pointer-events: none;
    }
  }

  .mdi {
    transform: rotate(-90deg);
  }
}
</style>
