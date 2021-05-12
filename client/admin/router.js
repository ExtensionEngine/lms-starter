import Content from '@/admin/components/Offerings/Program/Content';
import Enrollments from '@/admin/components/Offerings/Enrollments';
import get from 'lodash/get';
import Members from '@/admin/components/UserGroups/UserGroup/Members';
import { navigateTo } from '@/common/navigation';
import NotFound from '@/admin/components/common/NotFound';
import { numeric as numericParser } from '@/common/utils/paramsParser';
import Offerings from '@/admin/components/Offerings';
import OfferingUserGroups from '@/admin/components/Offerings/UserGroups';
import Program from '@/admin/components/Offerings/Program';
import { Role } from '@/../common/config';
import Router from 'vue-router';
import Settings from '@/admin/components/Offerings/Program/Settings';
import store from './store';
import UserGroup from '@/admin/components/UserGroups/UserGroup';
import UserGroups from '@/admin/components/UserGroups';
import UserGroupSettings from '@/admin/components/UserGroups/UserGroup/Settings';
import Users from '@/admin/components/users';
import UserSubGroups from '@/admin/components/UserGroups/UserGroup/SubGroups';
import Vue from 'vue';

Vue.use(Router);

// Handle 404
const fallbackRoute = { path: '*', component: NotFound };

const router = new Router({
  routes: [{
    path: '/',
    name: 'users',
    component: Users,
    meta: { auth: true }
  }, {
    path: '/user-groups',
    name: 'userGroups',
    component: UserGroups,
    meta: { auth: true }
  }, {
    path: '/user-groups/:userGroupId',
    component: UserGroup,
    props: numericParser.params,
    children: [{
      path: 'members',
      name: 'members',
      component: Members,
      props: numericParser.params,
      meta: { auth: true }
    }, {
      path: 'sub-groups',
      name: 'subGroups',
      component: UserSubGroups,
      props: numericParser.params,
      meta: { auth: true }
    }, {
      path: 'settings',
      name: 'userGroupSettings',
      component: UserGroupSettings,
      props: numericParser.params
    }]
  }, {
    path: '/offerings',
    name: 'offerings',
    component: Offerings,
    meta: { auth: true }
  }, {
    path: '/programs/:programId',
    component: Program,
    props: numericParser.params,
    children: [{
      path: '',
      name: 'programEnrollments',
      component: Enrollments,
      props: numericParser.params
    }, {
      path: 'user-groups',
      name: 'offeringUserGroups',
      component: OfferingUserGroups,
      props: numericParser.params
    }, {
      path: 'content',
      name: 'importedContent',
      component: Content,
      props: numericParser.params
    }, {
      path: 'settings',
      name: 'programSettings',
      component: Settings,
      props: numericParser.params
    }]
  }, fallbackRoute]
});

const isAdmin = user => user && user.role === Role.ADMIN;

router.beforeEach((_to, _from, next) => {
  const user = get(store.state, 'auth.user');
  return isAdmin(user) ? next() : navigateTo('/');
});

export default router;
