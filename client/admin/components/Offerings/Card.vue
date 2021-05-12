<template>
  <v-card
    color="primary"
    min-height="200"
    dark
    class="d-flex flex-column justify-space-between">
    <div>
      <v-chip
        color="teal darken-2"
        label small
        class="mt-3 ml-3">
        {{ type }}
      </v-chip>
      <v-card-title class="headline grey--text text--lighten-3">
        {{ name }}
      </v-card-title>
    </div>
    <v-card-actions class="justify-end mx-1">
      <v-btn :to="to" color="secondary" text>
        Open
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
const OfferingType = {
  COURSE: 'COURSE',
  SERIES: 'SERIES'
};

export default {
  props: {
    id: { type: Number, required: true },
    contentRepo: { type: Object, default: null },
    program: { type: Object, default: null }
  },
  computed: {
    isCourse: vm => vm.type === OfferingType.COURSE,
    type: vm => vm.contentRepo?.id ? OfferingType.COURSE : OfferingType.SERIES,
    name: vm => vm.isCourse ? vm.contentRepo.name : vm.program.name,
    to() {
      const { isCourse, contentRepo: course, program } = this;
      const params = isCourse ? { courseId: course.id } : { programId: program.id };
      return { name: 'offeringUserGroups', params };
    }
  }
};
</script>
