<template>
  <v-container fluid class="pa-8">
    <v-row class="toolbar">
      <v-col lg="4" md="6">
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
      <v-col lg="8" md="6" class="d-flex justify-end">
        <create-dialog @created="fetch(defaultPage)" />
      </v-col>
    </v-row>
    <v-data-iterator
      :items="offerings"
      :options.sync="options"
      :footer-props="{ itemsPerPageOptions: [30, 60, 90, -1] }"
      :server-items-length="totalItems"
      :hide-default-footer="totalItems < options.itemsPerPage">
      <template slot-scope="{ items }">
        <v-row>
          <v-col
            v-for="it in items"
            :key="it.id"
            lg="4"
            sm="12">
            <offering-card v-bind="it" />
          </v-col>
        </v-row>
      </template>
    </v-data-iterator>
  </v-container>
</template>

<script>
import api from '@/admin/api/offering';
import CreateDialog from './CreateDialog';
import OfferingCard from './Card';
import throttle from 'lodash/throttle';

const defaultPage = () => ({ page: 1, sortBy: ['updatedAt'], sortDesc: [true] });

export default {
  name: 'offering-list',
  data: () => ({
    offerings: [],
    filter: null,
    totalItems: 0,
    showArchived: false,
    options: { itemsPerPage: 30, ...defaultPage() }
  }),
  computed: {
    defaultPage
  },
  methods: {
    fetch: throttle(async function (opts) {
      Object.assign(this.options, opts);
      const { items, total } = await api.fetch({
        ...this.options,
        params: {
          filter: this.filter,
          deleted: this.showArchived
        }
      });
      this.offerings = items;
      this.totalItems = total;
    }, 400)
  },
  watch: {
    options: 'fetch',
    filter: 'fetch',
    showArchived: 'fetch'
  },
  created() {
    this.fetch();
  },
  components: {
    CreateDialog,
    OfferingCard
  }
};
</script>
