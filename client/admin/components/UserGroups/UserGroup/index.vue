<template>
  <v-container fluid>
    <div class="ml-10">
      <v-breadcrumbs :items="breadcrumbs" divider="|" class="px-0" />
      <v-tabs color="primary" background-color="transparent">
        <v-tab
          v-for="({ name, label }) in tabs"
          :key="name"
          :to="{ name, params: { userGroupId } }"
          exact ripple>
          {{ label }}
        </v-tab>
      </v-tabs>
    </div>
    <router-view
      v-if="userGroup"
      :key="userGroupId"
      @hydrate="fetch"
      :user-group="userGroup" />
  </v-container>
</template>

<script>
import api from '@/admin/api/userGroup';
import find from 'lodash/find';
import reverse from 'lodash/reverse';

const getBreadcrumbItems = (items, currentItem, result = [currentItem]) => {
  const parent = find(items, { id: currentItem.parentId });
  if (!parent) return reverse(result);
  result.push(parent);
  return getBreadcrumbItems(items, parent, result);
};

const formatBreadcrumbs = items => items.map(({ id, name }) => {
  const params = { userGroupId: id };
  return { text: name, to: { params } };
});

export default {
  name: 'user-group-container',
  props: {
    userGroupId: { type: Number, required: true }
  },
  data: () => ({ userGroups: [] }),
  computed: {
    tabs: () => [
      { name: 'members', label: 'Members' },
      { name: 'subGroups', label: 'Sub Groups' },
      { name: 'userGroupSettings', label: 'Settings' }
    ],
    userGroup: vm => find(vm.userGroups, { id: vm.userGroupId }),
    breadcrumbs() {
      if (!this.userGroup) return [];
      const { userGroup, userGroups } = this;
      const items = getBreadcrumbItems(userGroups, userGroup);
      return [{ text: 'User groups', disabled: true }, ...formatBreadcrumbs(items)];
    }
  },
  methods: {
    async fetch() {
      const params = { fetchAll: true };
      const { items } = await api.fetch({ params });
      this.userGroups = items;
    }
  },
  created() {
    this.fetch();
  }
};
</script>
