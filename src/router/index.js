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
    path: '/char',
    name: 'CharHome',
    component: () => import('../views/CharHome.vue')
  },
  {
    path: '/char/:id',
    name: 'CharDetail',
    component: () => import('../views/CharDetail.vue')
  },
  {
    path: '/char/:id/archive',
    name: 'CharArchive',
    component: () => import('../views/CharDetail.vue')
  },
  {
    path: '/char/:id/world',
    name: 'CharWorld',
    component: () => import('../views/CharDetail.vue')
  },
  {
    path: '/char/:id/memory',
    name: 'CharMemory',
    component: () => import('../views/CharDetail.vue')
  },
  {
    path: '/char/:id/relations',
    name: 'CharRelations',
    component: () => import('../views/CharDetail.vue')
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
    path: '/diary',
    name: 'Diary',
    component: () => import('../views/Diary.vue')
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
    path: '/style-import',
    name: 'StyleImport',
    component: () => import('../views/StyleImport.vue')
  },
  {
    path: '/world-book',
    name: 'WorldBook',
    component: () => import('../views/WorldBook.vue')
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
  },
  {
    path: '/games',
    name: 'Games',
    component: () => import('../views/Games.vue')
  },
  {
    path: '/games/gomoku',
    name: 'Gomoku',
    component: () => import('../views/Gomoku.vue')
  },
  {
    path: '/messages',
    name: 'MessageHome',
    component: () => import('../views/MessageHome.vue')
  },
  {
    path: '/messages/profile',
    name: 'MessageProfile',
    component: () => import('../views/MessageProfile.vue')
  },
  {
    path: '/messages/:id',
    name: 'MessageRoom',
    component: () => import('../views/MessageRoom.vue')
  },
  {
    path: '/messages/details/:id',
    name: 'MessageDetails',
    component: () => import('../views/MessageDetails.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
