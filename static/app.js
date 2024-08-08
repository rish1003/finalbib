import router from "./utils/router.js";

//import Navbar from "./components/Navbar.js";
// import store from "./utils/store.js";
new Vue({
    el: '#app',
    template: `
      <router-view/>
      `,
    router,
  });