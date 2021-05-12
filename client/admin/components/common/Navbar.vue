<template>
  <v-app-bar
    :dense="!!programId"
    extension-height="48"
    color="primary"
    elevation="2"
    app fixed clipped-left dark>
    <v-app-bar-nav-icon @click.native="$emit('update:drawer', !drawer)" />
    <v-toolbar-title>
      <v-icon dense class="mr-1">mdi-school</v-icon>
      Tailor
      <span class="pa-1">|</span>
      <span class="subtitle-1 secondary--text">LMS starter</span>
    </v-toolbar-title>
    <v-spacer />
    <v-menu min-width="220" transition="slide-y-transition" offset-y>
      <template v-slot:activator="{ on: menu }">
        <v-tooltip left>
          <template v-slot:activator="{ on: tooltip }">
            <v-btn icon large class="mr-2">
              <v-avatar
                v-on="{ ...tooltip, ...menu }"
                size="36"
                color="primary lighten-2">
                {{ user.firstName[0] }}
              </v-avatar>
            </v-btn>
          </template>
          <span>{{ user.label }}</span>
        </v-tooltip>
      </template>
      <v-list>
        <v-list-item @click="logout">
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <template v-if="programId" v-slot:extension>
      <div class="ml-10">
        <v-tabs
          color="grey lighten-2"
          background-color="transparent"
          slider-color="secondary">
          <v-tab
            v-for="({ name, label }) in tabs"
            :key="name"
            :to="{ name, params: { programId } }"
            exact ripple>
            {{ label }}
          </v-tab>
        </v-tabs>
      </div>
    </template>
  </v-app-bar>
</template>

<script>
import { mapActions, mapState } from 'vuex';

const parseNumber = val => val !== undefined ? parseInt(val, 10) : val;

export default {
  name: 'app-toolbar',
  props: {
    drawer: { type: Boolean, default: true }
  },
  computed: {
    ...mapState('auth', ['user']),
    ...mapState('programs', { programs: 'items' }),
    programId: vm => parseNumber(vm.$route.params.programId),
    tabs: () => [
      { name: 'offeringUserGroups', label: 'User Groups' },
      { name: 'programEnrollments', label: 'Enrollments' },
      { name: 'importedContent', label: 'Content' },
      { name: 'programSettings', label: 'Settings' }
    ]
  },
  methods: mapActions('auth', ['logout'])
};
</script>

<style lang="scss" scoped>
.v-breadcrumbs {
  padding: 0 0 0.25rem 1rem;
}
</style>
