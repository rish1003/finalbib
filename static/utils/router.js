
import Home from "../pages/Home.js";
import LoginRegister from "../pages/LoginRegister.js";
import Explore from "../pages/Explore.js";
import ReaderFeed from "../pages/ReaderFeed.js";
import ReaderProfile from "../pages/ReaderProfile.js";
import ReaderShelf from "../pages/ReaderShelf.js";
import AdminManagement from "../pages/AdminManagement.js";

import AdminUsers from "../pages/AdminUsers.js";
import EbookDetailPage from "../pages/EbookPage.js";
import AdminRequests from "../pages/AdminRequests.js";
import AdminHistory from "../pages/AdminHistory.js";

const routes = [
  { path: "/", component: Home ,name:"Home"},
  { path: "/loginregis", component: LoginRegister },
  { path: "/explore",component: Explore},
  { path: '/feed', component: ReaderFeed, meta: { requiresAuth: true, requiresRole: 'Reader' } },
  { path: '/profile', component: ReaderProfile, meta: { requiresAuth: true } },
  { path: '/myshelf', component: ReaderShelf, meta: { requiresAuth: true, requiresRole: 'Reader' } },
 
  { path: '/management', component: AdminManagement, meta: { requiresAuth: true, requiresRole: 'Admin' } },
  { path: '/users', component: AdminUsers, meta: { requiresAuth: true, requiresRole: 'Admin' } },

  { path: '/requests', component: AdminRequests, meta: { requiresAuth: true, requiresRole: 'Admin' } },
  { path: '/adminhistory', component: AdminHistory, meta: { requiresAuth: true, requiresRole: 'Admin' } },
  { path: '/ebook/:id', name: 'EbookDetailPage', component: EbookDetailPage, props: true,meta: { requiresAuth: true }}
];

const router = new VueRouter({
  routes,
});

export default router;