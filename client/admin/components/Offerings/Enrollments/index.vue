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
        <enrollment-dialog
          @enrolled="fetch(defaultPage)"
          :offering-id="offering.id" />
      </v-col>
    </v-row>
    <v-data-table
      :headers="headers"
      :items="enrollments"
      :options.sync="dataTable"
      :server-items-length="totalItems"
      :no-data-text="noEnrollmentsMessage"
      must-sort
      class="transparent">
      <template v-slot:item="{ item }">
        <tr>
          <td>{{ get(item.learner, 'email') }}</td>
          <td>{{ get(item.learner, 'firstName') }}</td>
          <td>{{ get(item.learner, 'lastName') }}</td>
          <td class="text-no-wrap">{{ item.createdAt | formatDate }}</td>
          <td class="text-no-wrap text-center">
            <v-btn @click="unenroll(item)" icon x-small>
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
    <confirmation-dialog
      @confirmed="fetch()"
      :visible.sync="confirmation.dialog"
      :action="confirmation.action"
      :message="confirmation.message"
      heading="Unenroll" />
  </div>
</template>

<script>
import api from '@/admin/api/enrollment';
import ConfirmationDialog from '@/admin/components/common/ConfirmationDialog';
import EnrollmentDialog from './EnrollmentDialog';
import get from 'lodash/get';
import throttle from 'lodash/throttle';

const defaultPage = () => ({ sortBy: ['updatedAt'], sortDesc: [true], page: 1 });
const headers = () => [
  { text: 'Email', value: 'learner.email', align: 'left' },
  { text: 'First Name', value: 'learner.first_name' },
  { text: 'Last Name', value: 'learner.last_name' },
  { text: 'Created At', value: 'createdAt' },
  { text: 'Actions', value: 'id', sortable: false, align: 'center' }
];

export default {
  name: 'enrollments',
  props: {
    offering: { type: Object, required: true }
  },
  data: () => ({
    enrollments: [],
    dataTable: { rowsPerPage: 10, ...defaultPage() },
    totalItems: 0,
    filter: null,
    confirmation: { dialog: null }
  }),
  computed: {
    headers,
    defaultPage,
    noEnrollmentsMessage() {
      return this.filter
        ? `Your search for "${this.filter}" found no results.`
        : 'Click on the button above to enroll learner.';
    }
  },
  methods: {
    get,
    fetch: throttle(async function (opts) {
      Object.assign(this.dataTable, opts);
      const params = {
        filter: this.filter,
        offeringId: this.offering.id
      };
      const { items, total } = await api.fetch({ ...this.dataTable, params });
      this.enrollments = items;
      this.totalItems = total;
    }, 400),
    unenroll(enrollment) {
      const { learner } = enrollment;
      Object.assign(this.confirmation, {
        message: `Are you sure you want to unenroll "${learner.label}"?`,
        action: () => api.remove(enrollment),
        dialog: true
      });
    }
  },
  watch: {
    dataTable: 'fetch',
    filter: 'fetch'
  },
  components: { ConfirmationDialog, EnrollmentDialog }
};
</script>
