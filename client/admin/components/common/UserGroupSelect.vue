<template>
  <v-autocomplete
    @change="$emit('input', $event)"
    v-bind="$attrs"
    :value="value"
    :items="items"
    :search-input.sync="search"
    :no-data-text="noDataLabel"
    item-text="name"
    return-object no-filter />
</template>

<script>
import throttle from 'lodash/throttle';
import userGroupApi from '@/admin/api/userGroup';

export default {
  name: 'user-group-select',
  props: {
    value: { type: Object, default: null },
    params: { type: Object, default: () => ({}) }
  },
  data: () => ({ userGroups: [], search: null }),
  computed: {
    items: vm => vm.value ? vm.userGroups.concat([vm.value]) : vm.userGroups,
    noDataLabel() {
      const { search, userGroups } = this;
      return !search && !userGroups.length
        ? 'Start typing to search...'
        : 'No matches found...';
    }
  },
  methods: {
    fetch: throttle(async function () {
      const params = { ...this.params, filter: this.search };
      this.userGroups = (await userGroupApi.fetch({ params })).items;
    }, 400)
  },
  watch: {
    search(filter) {
      if (filter) this.fetch();
    },
    value() {
      this.userGroups = [];
    }
  }
};
</script>
