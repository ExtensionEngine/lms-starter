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
        <import-dialog @imported="fetch(defaultPage)" />
        <bulk-enrollment-dialog :users="selectedUsers" />
        <v-btn @click.stop="showUserDialog()" text>
          <v-icon dense class="mr-1">mdi-plus</v-icon>Add user
        </v-btn>
      </v-col>
    </v-row>
    <v-data-table
      v-model="selectedUsers"
      :headers="headers"
      :items="users"
      :server-items-length="totalItems"
      :options.sync="dataTable"
      show-select must-sort
      class="ma-5 transparent">
      <template v-slot:item.createdAt="{ item }">
        {{ item.createdAt | formatDate }}
      </template>
      <template v-slot:item.lastActive="{ item }">
        <span v-if="!item.lastActive">Never</span>
        <v-timeago v-else :datetime="item.lastActive" />
      </template>
      <template v-slot:item.actions="{ item }">
        <div class="text-no-wrap text-center">
          <v-btn
            @click="showUserDialog(item)"
            color="grey darken-3"
            x-small icon>
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            @click="archiveOrRestore(item)"
            :disabled="user.id === item.id"
            color="grey darken-3"
            x-small icon>
            <v-icon>
              mdi-account-{{ item.deletedAt ? 'convert' : 'off' }}
            </v-icon>
          </v-btn>
        </div>
      </template>
    </v-data-table>
    <user-dialog
      @updated="fetch(defaultPage)"
      @created="fetch(defaultPage)"
      :visible.sync="userDialog"
      :user-data="editedUser" />
    <confirmation-dialog
      @update:visible="confirmation = null"
      @confirmed="fetch()"
      v-bind="confirmation"
      :visible="!!confirmation" />
  </v-container>
</template>

<script>
import api from '@/admin/api/user';
import BulkEnrollmentDialog from './BulkEnrollmentDialog';
import ConfirmationDialog from '../common/ConfirmationDialog';
import humanize from 'humanize-string';
import ImportDialog from './ImportDialog';
import { mapState } from 'vuex';
import throttle from 'lodash/throttle';
import UserDialog from './UserDialog';

const defaultPage = () => ({ sortBy: ['updatedAt'], sortDesc: [true], page: 1 });
const headers = () => [
  { text: 'Email', value: 'email' },
  { text: 'Role', value: 'role' },
  { text: 'First Name', value: 'firstName' },
  { text: 'Last Name', value: 'lastName' },
  { text: 'Date Created', value: 'createdAt' },
  { text: 'Last Active', value: 'lastActive' },
  { text: 'Actions', value: 'actions', align: 'center', sortable: false }
];
const actions = user => ({
  archive: () => api.remove(user),
  restore: () => api.create(user)
});

export default {
  name: 'user-list',
  data: () => ({
    users: [],
    selectedUsers: [],
    filter: null,
    dataTable: defaultPage(),
    totalItems: 0,
    userDialog: false,
    editedUser: null,
    showArchived: false,
    confirmation: null
  }),
  computed: {
    ...mapState('auth', ['user']),
    headers,
    defaultPage
  },
  methods: {
    showUserDialog(user = null) {
      this.editedUser = user;
      this.userDialog = true;
    },
    fetch: throttle(async function (opts) {
      Object.assign(this.dataTable, opts);
      const { items, total } = await api.fetch({
        ...this.dataTable,
        params: {
          filter: this.filter,
          archived: this.showArchived
        }
      });
      this.users = items;
      this.totalItems = total;
    }, 400),
    archiveOrRestore(user) {
      const action = user.deletedAt ? 'restore' : 'archive';
      this.confirmation = {
        heading: `${humanize(action)} user`,
        message: `Are you sure you want to ${action} user "${user.label}"?`,
        action: actions(user)[action]
      };
    }
  },
  watch: {
    dataTable: 'fetch',
    filter: 'fetch',
    showArchived: 'fetch'
  },
  components: {
    BulkEnrollmentDialog,
    ConfirmationDialog,
    ImportDialog,
    UserDialog
  }
};
</script>

<style lang="scss" scoped>
.user-table ::v-deep .v-input--checkbox {
  justify-content: center;
  margin-top: 0;
}
</style>
