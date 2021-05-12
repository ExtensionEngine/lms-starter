<template>
  <v-container fluid>
    <v-row class="ma-5">
      <v-col sm="4" md="5" lg="4">
        <v-text-field
          v-model="filter"
          append-icon="mdi-magnify"
          label="Search"
          single-line hide-details clearable />
        <v-checkbox
          v-model="showArchived"
          label="Show archived"
          hide-details
          class="my-2 archived-checkbox" />
      </v-col>
      <v-col sm="8" md="7" lg="8" class="d-flex justify-end">
        <v-btn @click.stop="showSubGroupDialog()" text>
          <v-icon dense class="mr-1">mdi-plus</v-icon>Add sub group
        </v-btn>
      </v-col>
    </v-row>
    <v-data-table
      :headers="headers"
      :items="subGroups"
      :server-items-length="totalItems"
      :options.sync="dataTable"
      must-sort
      class="ma-5 transparent">
      <template v-slot:item="{ item }">
        <router-link
          :key="item.id"
          :to="{ params: { userGroupId: item.id }}"
          tag="tr">
          <td>{{ item.name }}</td>
          <td class="text-no-wrap">{{ item.createdAt | formatDate }}</td>
          <td class="text-no-wrap text-center">
            <v-btn
              @click.stop="showSubGroupDialog(item)"
              color="grey darken-3"
              x-small icon
              class="mr-1">
              <v-icon>mdi-pencil-outline</v-icon>
            </v-btn>
            <v-btn
              @click.stop="archiveOrRestore(item)"
              color="grey darken-3"
              x-small icon>
              <v-icon>
                mdi-{{ item.deletedAt ? 'restore' : 'archive-outline' }}
              </v-icon>
            </v-btn>
          </td>
        </router-link>
      </template>
    </v-data-table>
    <sub-group-dialog
      @created="hydrateData"
      @updated="hydrateData"
      :visible.sync="subGroupDialog"
      :sub-group-data="editedSubGroup"
      :parent-id="userGroupId" />
    <confirmation-dialog
      @confirmed="fetch"
      :visible.sync="confirmation.dialog"
      :action="confirmation.action"
      :message="confirmation.message"
      heading="Archive or Restore" />
  </v-container>
</template>

<script>
import api from '@/admin/api/userGroup';
import ConfirmationDialog from '@/admin/components/common/ConfirmationDialog';
import SubGroupDialog from './SubGroupDialog';
import throttle from 'lodash/throttle';

const defaultPage = () => ({ sortBy: ['updatedAt'], sortDesc: [true], page: 1 });
const headers = () => [
  { text: 'Name', value: 'name' },
  { text: 'Date Created', value: 'createdAt' },
  { text: 'Actions', align: 'center', sortable: false }
];

const actions = subGroup => ({
  archive: () => api.remove(subGroup),
  restore: () => api.create(subGroup)
});

export default {
  name: 'sub-group-list',
  props: {
    userGroupId: { type: Number, required: true }
  },
  data: () => ({
    subGroups: [],
    filter: null,
    dataTable: { rowsPerPage: 10, ...defaultPage() },
    totalItems: 0,
    subGroupDialog: false,
    editedSubGroup: null,
    showArchived: false,
    confirmation: { dialog: null }
  }),
  computed: { headers },
  methods: {
    showSubGroupDialog(subGroup = null) {
      this.editedSubGroup = subGroup;
      this.subGroupDialog = true;
    },
    fetch: throttle(async function (opts = defaultPage) {
      Object.assign(this.dataTable, opts);
      const { options, filter, showArchived: archived, userGroupId } = this;
      const params = { filter, archived, parentId: userGroupId };
      const { items, total } = await api.fetch({ ...options, params });
      this.subGroups = items;
      this.totalItems = total;
    }, 400),
    archiveOrRestore(subGroup) {
      const { name, deletedAt } = subGroup;
      const action = deletedAt ? 'restore' : 'archive';
      Object.assign(this.confirmation, {
        message: `Are you sure you want to ${action} user group "${name}"?`,
        action: actions(subGroup)[action],
        dialog: true
      });
    },
    hydrateData() {
      this.$emit('hydrate');
      this.fetch();
    }
  },
  watch: {
    dataTable: 'fetch',
    filter: 'fetch',
    showArchived: 'fetch'
  },
  components: { ConfirmationDialog, SubGroupDialog }
};
</script>
