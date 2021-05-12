<template>
  <v-autocomplete
    @change="$emit('input', $event)"
    v-bind="$attrs"
    :value="value"
    :items="items"
    :search-input.sync="search"
    :no-data-text="noDataLabel"
    return-object no-filter>
    <template #selection="{ item }">
      {{ item.fullName }} ({{ item.email }})
    </template>
    <template #item="{ item }">
      {{ item.fullName }} ({{ item.email }})
    </template>
  </v-autocomplete>
</template>

<script>
import throttle from 'lodash/throttle';
import userApi from '@/admin/api/user';

export default {
  name: 'user-select',
  props: {
    value: { type: Object, default: null },
    params: { type: Object, default: () => ({}) }
  },
  data: () => ({ users: [], search: null }),
  computed: {
    items: vm => vm.value ? vm.users.concat([vm.value]) : vm.users,
    noDataLabel() {
      const { search, users } = this;
      return !search && !users.length
        ? 'Start typing to search...'
        : 'No matches found...';
    }
  },
  methods: {
    fetch: throttle(async function () {
      const params = { ...this.params, filter: this.search };
      this.users = (await userApi.fetch({ params })).items;
    }, 400)
  },
  watch: {
    search(filter) {
      if (filter) this.fetch();
    },
    value() {
      this.users = [];
    }
  }
};
</script>
