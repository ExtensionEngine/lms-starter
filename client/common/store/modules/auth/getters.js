import get from 'lodash/get';

export const isAdmin = state => get(state, 'user.role') === 'ADMIN';

export const userCohortId = state => get(state, 'user.cohortId');
