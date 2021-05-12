import Activity from '@/main/components/program/Activity';
import Auth from '@/main/components/auth';
import Courseware from '@/main/components/program/Courseware';
import ForgotPassword from '@/main/components/auth/ForgotPassword';
import get from 'lodash/get';
import Home from '@/main/components';
import Login from '@/main/components/auth/Login';
import { navigateTo } from '@/common/navigation';
import NotFound from '@/admin/components/common/NotFound';
import { numeric as numericParser } from '@/common/utils/paramsParser';
import Preview from '@/main/components/preview';
import Program from '@/main/components/program';
import ProgramSelection from '@/main/components/ProgramSelection';
import ResetPassword from '@/main/components/auth/ResetPassword';
import { Role } from '@/../common/config';
import Router from 'vue-router';
import store from './store';
import Vue from 'vue';

Vue.use(Router);

// Handle 404
const fallbackRoute = { path: '*', component: NotFound };

const router = new Router({
  routes: [{
    path: '/auth',
    name: 'auth',
    component: Auth,
    children: [{
      path: 'login',
      name: 'login',
      component: Login
    }, {
      path: 'forgot-password',
      name: 'forgot-password',
      component: ForgotPassword
    }, {
      path: 'reset-password/:token',
      name: 'reset-password',
      component: ResetPassword
    }]
  }, {
    path: '/',
    component: Home,
    meta: { auth: true },
    children: [{
      path: '',
      name: 'program-selection',
      component: ProgramSelection
    }, {
      path: 'programs/:programId',
      component: Program,
      props: numericParser.params,
      children: [{
        path: '',
        name: 'courseware',
        component: Courseware,
        props: numericParser.params
      }, {
        path: 'repository/:repositoryId/activity/:activityId',
        name: 'activity',
        component: Activity,
        props: numericParser.params
      }]
    }]
  },
  {
    path: '/preview/:previewId',
    name: 'preview',
    component: Preview,
    props: numericParser.params
  },
  fallbackRoute]
});

const isAdmin = user => user && user.role === Role.ADMIN;
const requiresAuth = route => route.matched.some(it => it.meta.auth);

router.beforeEach((to, _from, next) => {
  const user = get(store.state, 'auth.user');
  if (requiresAuth(to) && !user) return next({ name: 'login' });
  return !isAdmin(user) ? next() : navigateTo('/admin');
});

export default router;
