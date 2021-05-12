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
        <create-dialog @create="createOrRestore" />
      </v-col>
    </v-row>
    <v-data-iterator
      :items="userGroups"
      :options.sync="options"
      :footer-props="{ itemsPerPageOptions: [30, 60, 90, -1] }"
      :server-items-length="totalItems"
      :hide-default-footer="totalItems < options.itemsPerPage">
      <template slot-scope="{ items }">
        <v-row>
          <v-col v-for="item in items" :key="item.id" lg="4" sm="12">
            <v-card
              color="primary"
              min-height="200"
              dark
              class="d-flex flex-column justify-space-between">
              <v-card-title class="headline grey--text text--lighten-3">
                {{ item.name }}
              </v-card-title>
              <v-card-actions class="justify-end">
                <v-btn
                  v-if="item.deletedAt"
                  @click="createOrRestore(item)"
                  color="secondary"
                  text>
                  <v-icon class="mr-1">mdi-restore</v-icon>
                  Restore
                </v-btn>
                <v-btn
                  v-else
                  :to="{ name: 'members', params: { userGroupId: item.id } }"
                  color="secondary"
                  text>
                  Open
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </v-data-iterator>
  </v-container>
</template>

<script>
import api from '@/admin/api/userGroup';
import CreateDialog from './CreateDialog';
import throttle from 'lodash/throttle';

const defaultPage = () => ({ sortBy: ['updatedAt'], sortDesc: [true], page: 1 });

export default {
  name: 'user-group-list',
  data: () => ({
    userGroups: [],
    filter: null,
    totalItems: 0,
    showArchived: false,
    options: { itemsPerPage: 30, ...defaultPage() }
  }),
  computed: { defaultPage },
  methods: {
    fetch: throttle(async function (opts) {
      Object.assign(this.options, opts);
      const params = { filter: this.filter, archived: this.showArchived };
      const { items, total } = await api.fetch({ ...this.options, params });
      this.userGroups = items;
      this.totalItems = total;
    }, 400),
    createOrRestore(userGroup) {
      return api.create(userGroup)
        .then(() => this.fetch(defaultPage))
        .finally(() => (this.showArchived = false));
    }
  },
  watch: {
    options: 'fetch',
    filter: 'fetch',
    showArchived: 'fetch'
  },
  components: { CreateDialog }
};
</script>
