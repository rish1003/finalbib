import Navbar from '../components/Navbar.js';

const LandingPage = {
  components: {
    Navbar,
  },
  template: `
    <div>
      <Navbar />
      <div class="landing-page">
        <div class="hero-section">
          <div class="hero-text">
            <h1 class="display-4">Welcome to Bibliotheca</h1>
            <p class="lead">A curated collection of timeless classics and contemporary works.</p>
            <router-link to="/explore" class="btn btn-primary btn-lg" role="button">Explore Now</router-link>
          </div>
        </div>
        <div class="content-section">
          <div class="container">
            <div class="row">
              <div class="col-md-6">
                <h2>Discover Classics</h2>
                <p>Explore our vast collection of classic literature from authors like Jane Austen, Charles Dickens, and more.</p>
              </div>
              <div class="col-md-6">
                <h2>Modern Works</h2>
                <p>Stay updated with the latest contemporary works from up-and-coming authors and bestselling novels.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="content-section bg-light">
          <div class="container">
            <div class="row">
              <div class="col-md-6">
                <h2>Easy Access</h2>
                <p>Access your favorite books anytime, anywhere with our user-friendly platform.</p>
              </div>
              <div class="col-md-6">
                <h2>Join the Community</h2>
                <p>Connect with fellow book lovers, share reviews, and participate in discussions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  style: `
    .landing-page {
      font-family: 'Merriweather', serif;
    }
    .hero-section {
      background-image: url('C:\Users\rishi\Desktop\bibliotheca\media\lp_bg.jpg'); /* Replace with your background image URL */
      background-size: cover;
      background-attachment: fixed;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fdf3e3;
      text-align: center;
    }
    .hero-text {
      background-color: rgba(0, 0, 0, 0.5);
      padding: 2rem;
      border-radius: 0.5rem;
    }
    .content-section {
      padding: 4rem 0;
    }
    .content-section h2 {
      font-family: 'Cinzel', serif;
      margin-bottom: 1rem;
    }
    .content-section p {
      font-size: 1.2rem;
      line-height: 1.5;
    }
    .bg-light {
      background-color: #f8f5f2;
    }
  `,
};

export default LandingPage;
