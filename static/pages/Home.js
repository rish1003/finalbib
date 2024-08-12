import Navbar from "../components/Navbar.js";
import Reader from "./Reader.js";
import Admin from "./Admin.js";
import LandingPage from "./LandingPage.js";

const Home = {
  template: `
    <div>
      <component :is="currentView"></component>
    </div>
  `,
  data() {
    return {
      currentView: '',
      token: localStorage.getItem('token') || ''
    };
  },
  created() {
    this.checkAuth();
  },
  methods: {
    async checkAuth() {
      if (this.token) {
        try {
          const response = await fetch('/api/check_token_and_login', {
            method: 'GET',
            headers: {
              'Authentication-Token':this.token,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const roles = data.roles;

            if (roles.includes('Admin')) {
              this.currentView = 'Admin';
            } else if (roles.includes('Reader')) {
              this.currentView = 'Reader';
            } else {
              this.currentView = 'LandingPage';
            }


            localStorage.setItem('role', roles.join(','));

          } else {
            alert("User NOT authorized");
            this.currentView = 'LandingPage';
            localStorage.removeItem('token');
            localStorage.removeItem('role');
          }

        } catch (error) {
          alert("User NOT authorized");
          console.error('Error checking token and login:', error);
          this.currentView = 'LandingPage';
        }
      } else {
        
        this.currentView = 'LandingPage';
        
      }
    }
  },
  components: {
    Reader,
    Admin,
    LandingPage,
    Navbar
  }
};

export default Home;
