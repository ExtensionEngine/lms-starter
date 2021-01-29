import Content from '@/admin/components/Program/Content';
import Enrollments from '@/admin/components/Program/Enrollments';
import get from 'lodash/get';
import Groups from '@/admin/components/Groups';
import Members from '@/admin/components/Groups/Members';
import { navigateTo } from '@/common/navigation';
import NotFound from '@/admin/components/common/NotFound';
import { numeric as numericParser } from '@/common/utils/paramsParser';
import Program from '@/admin/components/Program';
import role from '@/../common/config/role';
import Router from 'vue-router';
import Settings from '@/admin/components/Program/Settings';
import store from './store';
import Users from '@/admin/components/users';
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
    path: '/groups',
    name: 'groups',
    component: Groups,
    meta: { auth: true }
  }, {
    path: '/groups/:groupId/members',
    name: 'members',
    props: numericParser.params,
    component: Members,
    meta: { auth: true }
  }, {
    path: '/programs/:programId',
    component: Program,
    props: numericParser.params,
    children: [{
      path: '',
      name: 'enrollments',
      component: Enrollments,
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

const isAdmin = user => user && user.role === role.ADMIN;

router.beforeEach((_to, _from, next) => {
  const user = get(store.state, 'auth.user');
  return isAdmin(user) ? next() : navigateTo('/');
});

export default router;
