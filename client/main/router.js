import Activity from '@/main/components/program/Activity';
import Auth from '@/main/components/auth';
import Courseware from '@/main/components/program/Courseware';
import ForgotPassword from '@/main/components/auth/ForgotPassword';
import get from 'lodash/get';
import Home from '@/main/components';
import Login from '@/main/components/auth/Login';
import { navigateTo } from '@/common/navigation';
import NotFound from '@/admin/components/common/NotFound';
import Preview from '@/main/components/preview';
import Program from '@/main/components/program';
import ProgramSelection from '@/main/components/ProgramSelection';
import ResetPassword from '@/main/components/auth/ResetPassword';
import { Role } from '@/../common/config';
import Router from 'vue-router';
import store from './store';
import transform from 'lodash/transform';
import Vue from 'vue';

Vue.use(Router);

const parseParams = ({ params }) => {
  return transform(params, (acc, val, key) => (acc[key] = parseInt(val, 10)), {});
};
// Handle 404
const fallbackRoute = { path: '*', component: NotFound };

const router = new Router({
  mode: process.env.HISTORY_API_FALLBACK ? 'history' : 'hash',
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
      props: parseParams,
      children: [{
        path: '',
        name: 'courseware',
        component: Courseware,
        props: parseParams
      }, {
        path: 'repository/:repositoryId/activity/:activityId',
        name: 'activity',
        component: Activity,
        props: parseParams
      }]
    }]
  },
  {
    path: '/preview/:previewId',
    name: 'preview',
    component: Preview,
    props: parseParams
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
