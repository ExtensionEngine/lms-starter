<template>
  <v-container fluid>
    <v-row class="ma-5">
      <v-col sm="4" md="5" lg="4">
        <v-text-field
          v-model="filter.user"
          append-icon="mdi-magnify"
          label="Search"
          single-line hide-details clearable />
        <v-select
          v-model="filter.role"
          :items="roles"
          name="role"
          label="Filter by Role"
          clearable
          class="mt-2" />
        <v-checkbox
          v-model="showArchived"
          label="Show archived"
          hide-details
          class="my-2 archived-checkbox" />
      </v-col>
      <v-col sm="8" md="7" lg="8" class="d-flex justify-end">
        <v-btn @click.stop="showMemberDialog()" text>
          <v-icon dense class="mr-1">mdi-plus</v-icon>Add Member
        </v-btn>
      </v-col>
    </v-row>
    <v-data-table
      :headers="headers"
      :items="members"
      :server-items-length="totalItems"
      :options.sync="dataTable"
      must-sort
      class="ma-5 transparent">
      <template v-slot:item="{ item }">
        <tr :key="item.id">
          <td>{{ item.role }}</td>
          <td>{{ get(item.user, 'email') }}</td>
          <td>{{ get(item.user, 'fullName') }}</td>
          <td class="text-no-wrap">{{ item.createdAt | formatDate }}</td>
          <td class="text-no-wrap text-center">
            <v-btn
              @click="showMemberDialog(item)"
              color="grey darken-3"
              x-small icon
              class="mr-1">
              <v-icon>mdi-pencil-outline</v-icon>
            </v-btn>
            <v-btn
              @click="archiveOrRestore(item)"
              color="grey darken-3"
              x-small icon>
              <v-icon>
                mdi-{{ item.deletedAt ? 'restore' : 'archive-outline' }}
              </v-icon>
            </v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
    <member-dialog
      @created="fetch(defaultPage)"
      @updated="fetch(defaultPage)"
      :visible.sync="memberDialog"
      v-bind="{ memberData: editedMember, userGroupId, userIds, roles }" />
    <confirmation-dialog
      @confirmed="fetch()"
      :visible.sync="confirmation.dialog"
      :action="confirmation.action"
      :message="confirmation.message"
      heading="Archive or Restore" />
  </v-container>
</template>

<script>
import api from '@/admin/api/userGroupMember';
import ConfirmationDialog from '../../../common/ConfirmationDialog';
import get from 'lodash/get';
import humanize from 'humanize-string';
import map from 'lodash/map';
import MemberDialog from './MemberDialog';
import throttle from 'lodash/throttle';
import { UserGroupRole } from '@/../common/config';

const defaultPage = () => ({ sortBy: ['updatedAt'], sortDesc: [true], page: 1 });
const headers = () => [
  { text: 'Group Member Role', value: 'role' },
  { text: 'Email', value: 'email' },
  { text: 'Full Name', value: 'fullName' },
  { text: 'Date Created', value: 'createdAt' },
  { text: 'Actions', align: 'center', sortable: false }
];

const actions = member => ({
  archive: () => api.remove(member),
  restore: () => api.create(member)
});

export default {
  name: 'member-list',
  props: {
    userGroupId: { type: Number, required: true }
  },
  data: () => ({
    members: [],
    filter: { user: null, role: null },
    dataTable: { rowsPerPage: 10, ...defaultPage() },
    totalItems: 0,
    memberDialog: false,
    editedMember: null,
    showArchived: false,
    confirmation: { dialog: null }
  }),
  computed: {
    headers,
    defaultPage,
    userIds: vm => vm.members.map(it => it.userId),
    roles: () => map(UserGroupRole, it => ({ text: humanize(it), value: it }))
  },
  methods: {
    get,
    showMemberDialog(member = null) {
      this.editedMember = member;
      this.memberDialog = true;
    },
    fetch: throttle(async function (opts) {
      Object.assign(this.dataTable, opts);
      const { dataTable, userGroupId, filter, showArchived: archived } = this;
      const options = { ...dataTable, params: { filter, archived } };
      const { items, total } = await api.fetch(userGroupId, options);
      this.members = items;
      this.totalItems = total;
    }, 400),
    archiveOrRestore(member) {
      const { user, deletedAt } = member;
      const action = deletedAt ? 'restore' : 'archive';
      Object.assign(this.confirmation, {
        message: `Are you sure you want to ${action} member "${user.label}"?`,
        action: actions(member)[action],
        dialog: true
      });
    }
  },
  watch: {
    filter: {
      deep: true,
      handler: 'fetch'
    },
    dataTable: 'fetch',
    showArchived: 'fetch'
  },
  components: { ConfirmationDialog, MemberDialog }
};
</script>
