import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Desktop',
    component: () => import('../views/Desktop.vue')
  },
  {
    path: '/chats',
    name: 'Chats',
    component: () => import('../views/Chats.vue')
  },
  {
    path: '/chat/:id',
    name: 'ChatRoom',
    component: () => import('../views/ChatRoom.vue')
  },
  {
    path: '/contacts',
    name: 'Contacts',
    component: () => import('../views/Contacts.vue')
  },
  {
    path: '/contacts/new',
    name: 'NewRole',
    component: () => import('../views/NewRole.vue')
  },
  {
    path: '/contacts/edit/:id',
    name: 'EditRole',
    component: () => import('../views/EditRole.vue')
  },
  {
    path: '/discover',
    name: 'Discover',
    component: () => import('../views/Discover.vue')
  },
  {
    path: '/moments',
    name: 'Moments',
    component: () => import('../views/Moments.vue')
  },
  {
    path: '/me',
    name: 'Me',
    component: () => import('../views/Me.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue')
  },
  {
    path: '/chat-details/conv/:convId',
    name: 'ChatDetails',
    component: () => import('../views/ChatDetails.vue')
  },
  {
    path: '/settings',
    name: 'AppSettings',
    component: () => import('../views/AppSettings.vue')
  },
  {
    path: '/personas',
    name: 'UserPersonas',
    component: () => import('../views/UserPersonas.vue')
  },
  {
    path: '/stickers',
    name: 'StickerManage',
    component: () => import('../views/StickerManage.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
