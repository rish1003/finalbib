
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
      currentView: ''
    };
  },
  created() {
    const roles = localStorage.getItem('role') ? localStorage.getItem('role').split(',') : [];
    if (roles.includes('Admin')) {
      this.currentView = 'Admin';
    } else if (roles.includes('Reader')) {
      this.currentView = 'Reader';
    } else {
      this.currentView = 'LandingPage';
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