import LogoutDialog from './LogoutDialog.js';

const Navbar = {
  components: {
    LogoutDialog
  },
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark">
      <router-link class="navbar-brand" to="/">Bibliotheca</router-link>
      <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ml-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/">Home</router-link>
          </li>
          
      
          <template v-if="!isLoggedIn">
          <li class="nav-item">
            <router-link class="nav-link" to="/explore">Explore</router-link>
          </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/loginregis">Login</router-link>
            </li>
          </template>

          <template v-if="isLoggedIn">
            <template v-if="isReader">
              <li class="nav-item">
                <router-link class="nav-link" to="/feed">Feed</router-link>
              </li>
              
              <li class="nav-item">
                <router-link class="nav-link" to="/myshelf">My Shelf</router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link" to="/profile">Profile</router-link>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="showLogoutDialog">Logout</a>
              </li>
            </template>
            <template v-if="isAdmin">
              <li class="nav-item">
                <router-link class="nav-link" to="/management">Management</router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link" to="/users">Users</router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link" to="/requests">Requests</router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link" to="/adminhistory">History</router-link>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click.prevent="showLogoutDialog">Logout</a>
              </li>
            </template>
          </template>
        </ul>
      </div>
      <logout-dialog @logoutConfirmed="handleLogout" />
    </nav>
  `,
  components: {
    LogoutDialog
  },
  data() {
    return {
      isLoggedIn: false,
      isReader: false,
      isAdmin: false,
    };
  },
  created() {
    this.checkAuth();
  },
  methods: {
    checkAuth() {
      const role = localStorage.getItem("role");
      const token = localStorage.getItem("token");

      this.isLoggedIn = !!token;

      if (this.isLoggedIn) {
        this.isReader = role === "Reader";
        this.isAdmin = role === "Admin";
      }
    },
    showLogoutDialog() {
      $('#logoutModal').modal('show');
    },
    handleLogout() {
      this.isLoggedIn = false;
      this.isReader = false;
      this.isAdmin = false;
    }
  }
};

export default Navbar;
