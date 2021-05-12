<template>
  <admin-dialog
    v-model="isVisible"
    @click:outside="close"
    header-icon="mdi-book-arrow-up-outline">
    <template v-slot:activator="{ on }">
      <v-btn v-on="on" text>
        <v-icon dense class="mr-1">mdi-book-arrow-up-outline</v-icon>
        Import Content
      </v-btn>
    </template>
    <template v-slot:header>Import Content</template>
    <template v-slot:body>
      <v-form @submit.prevent="importRepo">
        <v-autocomplete
          v-model="sourceId"
          :items="availableRepos"
          :loading="isLoading"
          item-value="sourceId"
          label="Repository"
          placeholder="Start typing to search"
          no-data-text="No available repositories for import"
          prepend-icon="mdi-magnify"
          hide-selected />
        <div class="d-flex justify-end">
          <v-btn @click="close" :disabled="isImporting" text>Cancel</v-btn>
          <v-btn
            :disabled="!sourceId"
            :loading="isImporting"
            type="submit"
            text>
            Import
          </v-btn>
        </div>
      </v-form>
    </template>
  </admin-dialog>
</template>

<script>
import AdminDialog from '@/admin/components/common/Dialog';
import api from '@/admin/api/contentRepo';
import differenceBy from 'lodash/differenceBy';
import map from 'lodash/map';
import { mapActions } from 'vuex';
import pick from 'lodash/pick';

export default {
  name: 'content-import-dialog',
  props: {
    programId: { type: Number, required: true },
    importedRepos: { type: Array, default: () => [] }
  },
  data: () => ({
    isVisible: false,
    catalog: [],
    sourceId: null,
    isImporting: false,
    isLoading: false
  }),
  computed: {
    availableRepos: vm => differenceBy(vm.catalog, vm.importedRepos, 'sourceId')
  },
  methods: {
    ...mapActions('contentRepo', ['save']),
    importRepo() {
      this.isImporting = true;
      this.save(pick(this, ['sourceId', 'programId']))
        .finally(() => {
          this.isImporting = false;
          this.close();
        });
    },
    setCatalog(repos) {
      this.catalog = map(repos, it => ({ text: it.name, sourceId: it.id }));
    },
    close() {
      this.isVisible = false;
      this.sourceId = null;
      this.catalog = [];
    }
  },
  watch: {
    isVisible(val) {
      if (!val) return;
      this.isLoading = true;
      return api.getCatalog()
        .then(this.setCatalog)
        .finally(() => (this.isLoading = false));
    }
  },
  components: { AdminDialog }
};
</script>
