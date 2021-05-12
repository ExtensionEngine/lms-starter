<template>
  <div class="ma-4">
    <v-row class="my-6">
      <v-col md="6" lg="4">
        <v-text-field
          v-model.trim="filter"
          label="Search"
          append-icon="mdi-magnify"
          single-line hide-details clearable />
      </v-col>
      <v-col md="6" lg="8" class="d-flex justify-end">
        <user-group-dialog
          @added="fetch(defaultPage)"
          v-bind="{ offeringId, userGroupIds }" />
      </v-col>
    </v-row>
    <v-data-table
      :headers="headers"
      :items="userGroups"
      :options.sync="dataTable"
      :server-items-length="totalItems"
      :no-data-text="noUserGroupsMessage"
      must-sort
      class="transparent">
      <template v-slot:item="{ item }">
        <router-link
          :to="{ name: 'members', params: { userGroupId: item.userGroupId } }"
          tag="tr">
          <td>{{ item.userGroup.name }}</td>
          <td class="text-no-wrap">{{ item.createdAt | formatDate }}</td>
          <td class="text-no-wrap text-center">
            <v-btn @click.stop="remove(item)" icon x-small>
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
          </td>
        </router-link>
      </template>
    </v-data-table>
    <confirmation-dialog
      @confirmed="fetch()"
      :visible.sync="confirmation.dialog"
      :action="confirmation.action"
      :message="confirmation.message"
      heading="Remove" />
  </div>
</template>

<script>
import api from '@/admin/api/offering';
import ConfirmationDialog from '@/admin/components/common/ConfirmationDialog';
import throttle from 'lodash/throttle';
import UserGroupDialog from './UserGroupDialog';

const defaultPage = () => ({ sortBy: ['updatedAt'], sortDesc: [true], page: 1 });
const headers = () => [
  { text: 'Name', value: 'userGroup.name', align: 'left' },
  { text: 'Created At', value: 'createdAt' },
  { text: 'Actions', align: 'center', sortable: false }
];

export default {
  name: 'offering-user-groups',
  props: {
    offering: { type: Object, required: true }
  },
  data: () => ({
    userGroups: [],
    dataTable: { rowsPerPage: 10, ...defaultPage() },
    totalItems: 0,
    filter: null,
    confirmation: { dialog: null }
  }),
  computed: {
    headers,
    defaultPage,
    offeringId: vm => vm.offering.id,
    userGroupIds: vm => vm.userGroups.map(it => it.userGroupId),
    noUserGroupsMessage() {
      return this.filter
        ? `Your search for "${this.filter}" found no results.`
        : 'Click on the button above to add user group.';
    }
  },
  methods: {
    fetch: throttle(async function (opts) {
      Object.assign(this.dataTable, opts);
      const { dataTable, filter, offeringId } = this;
      const options = { ...dataTable, params: { filter } };
      const { items, total } = await api.getUserGroups(offeringId, options);
      this.userGroups = items;
      this.totalItems = total;
    }, 400),
    remove(offeringUserGroup) {
      const { name } = offeringUserGroup.userGroup;
      Object.assign(this.confirmation, {
        message: `Are you sure you want to remove "${name}"?`,
        action: () => api.removeUserGroup(offeringUserGroup),
        dialog: true
      });
    }
  },
  watch: {
    dataTable: 'fetch',
    filter: 'fetch'
  },
  components: { ConfirmationDialog, UserGroupDialog }
};
</script>
