<template>
  <div class="ma-4">
    <v-row class="my-6">
      <v-col md="6" lg="4">
        <v-text-field
          v-model.trim="filter"
          :disabled="!importedRepos.length"
          append-icon="mdi-magnify"
          label="Search"
          hide-details single-line clearable />
        <v-checkbox
          v-model="showArchived"
          label="Show archived"
          hide-details
          class="archived-checkbox my-2" />
      </v-col>
      <v-col md="6" lg="8" class="d-flex justify-end">
        <content-dialog :program-id="program.id" :imported-repos="importedRepos" />
      </v-col>
    </v-row>
    <v-data-table
      :headers="headers"
      :items="filteredRepos"
      :no-data-text="noContentMessage"
      hide-default-footer
      class="transparent">
      <template v-slot:item="{ item }">
        <tr
          v-show="!item.deletedAt || showArchived"
          :key="item.sourceId"
          :class="{ 'grey lighten-2': item.deletedAt }">
          <td>{{ item.name }}</td>
          <td class="text-no-wrap">{{ item.repoVersion | formatDate }}</td>
          <td class="text-no-wrap">{{ item.publishedAt | formatDate }}</td>
          <td class="text-no-wrap text-center">
            <v-btn
              v-if="item.repoVersion > item.publishedAt"
              @click="save(item)"
              text x-small>
              Sync
            </v-btn>
            <span v-else-if="item.repoVersion">Synced</span>
          </td>
          <td class="text-no-wrap text-center actions">
            <v-btn
              v-if="!item.deletedAt"
              @click="showConfirmationDialog(item)"
              icon x-small>
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
            <v-btn v-else @click="showRestoreDialog(item)" icon x-small>
              <v-icon>mdi-restore</v-icon>
            </v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
    <confirmation-dialog
      @update:visible="confirmation = null"
      @confirmed="fetchProgramRepos()"
      v-bind="confirmation" />
    <multiple-choice-dialog
      @closed="restoreOptions = null"
      @completed="fetchProgramRepos()"
      v-bind="restoreOptions" />
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import api from '@/admin/api/contentRepo';
import ConfirmationDialog from '@/admin/components/common/ConfirmationDialog';
import ContentDialog from './ContentDialog';
import filter from 'lodash/filter';
import fuzzysearch from 'fuzzysearch';
import MultipleChoiceDialog from '@/admin/components/common/MultipleChoiceDialog';

const fuzzy = (input, content) => {
  return fuzzysearch(input.toLowerCase(), content.toLowerCase());
};
const headers = () => [
  { text: 'Name', value: 'name', align: 'left' },
  { text: 'Published Version', value: 'repoVersion' },
  { text: 'Imported Version', value: 'publishedAt' },
  { text: 'Sync', value: 'id', sortable: false, align: 'center' },
  { text: 'Actions', value: 'id', sortable: false, align: 'center' }
];

export default {
  name: 'imported-content',
  props: {
    program: { type: Object, required: true }
  },
  data: () => ({
    filter: null,
    confirmation: null,
    showArchived: true,
    restoreOptions: null
  }),
  computed: {
    ...mapState('contentRepo', { repoStore: 'items' }),
    headers,
    importedRepos() {
      const { program } = this;
      return filter(this.repoStore, it => it.id && (it.programId === program.id));
    },
    filteredRepos() {
      if (!this.filter) return this.importedRepos;
      return this.importedRepos.filter(it => {
        return it.name && fuzzy(this.filter, it.name);
      });
    },
    noContentMessage() {
      return this.filter
        ? `Your search for "${this.filter}" found no results.`
        : 'Click on the button above to import content.';
    }
  },
  methods: {
    ...mapActions('contentRepo', ['fetch', 'save']),
    fetchProgramRepos() {
      const { program } = this;
      return this.fetch({
        programId: program.id,
        srcVersion: true,
        archived: true
      });
    },
    showConfirmationDialog(item) {
      this.confirmation = {
        message: `Are you sure you want to archive "${item.name}"?`,
        heading: 'Archive content repository',
        action: () => api.archive(item),
        visible: true
      };
    },
    showRestoreDialog(item) {
      this.restoreOptions = {
        heading: `${item.name}`,
        message: 'Would you like to restore this course or import the latest version?',
        warning: 'Importing new repository overwrites the existing (archived) copy.',
        actions: [
          { label: 'restore', callback: () => api.restore(item) },
          { label: 'import', callback: () => this.save(item) }
        ],
        visible: true
      };
    }
  },
  created() {
    this.fetchProgramRepos();
  },
  components: { ConfirmationDialog, ContentDialog, MultipleChoiceDialog }
};
</script>

<style lang="scss" scoped>
.actions {
  width: 15.625rem;
}
</style>
