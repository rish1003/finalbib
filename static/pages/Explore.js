import Navbar from '../components/Navbar.js';

const Explore = {
  components: {
    Navbar,
  },
  template: `
    <div>
      <Navbar />
      <div class="explore-page" style="background-color: #f5f2f0;">
        <section class="content-section light-bg" style="background-color: #f5f2f0;">
          <div class="container">
            <div class="row align-items-center">
              <div class="col-md-12">
           
                <h2>About Us</h2>
                <p style="size:50px;justify-text:center;"> 
Welcome to <b> Bibliotheca </b>, where timeless stories meet modern convenience. Step into our digital sanctuary, a premier eLibrary crafted for the avid reader and the curious mind alike. 

<br/><br/>Immerse yourself in an extensive collection of eBooks that span a world of genres—from ancient Greek epics to contemporary classics. Our mission is to rekindle your love for reading, offering a gateway to knowledge and imagination at your fingertips.

Explore our curated selection, borrow cherished titles, and purchase new favorites with effortless ease. <br/><br/>Whether you're seeking wisdom from antiquity or the latest bestseller, Bibliotheca is your gateway to a universe of literary treasures.

Join us on this journey through the ages and let the adventure of reading unfold with every page you turn!             </p>
               
              </div>
            </div>
          </div>
        </section>

        <section class="content-section light-bg" style="background-color: #3c2a1a; color: #fff;">
          <div class="container">
            <div class="row align-items-center">
              <div class="col-md-6">

                <h2>How to Borrow from the Library</h2>
                <p>
Embarking on your next great read is simple and delightful with Bibliotheca. To borrow a book, start by exploring our diverse and curated collection of eBooks. Once you find a title that captures your imagination, click the "Borrow from Library" button. This action will add the book to your account, where you can access it anytime, anywhere. Enjoy the freedom to dive into your chosen book at your own pace and discover new worlds with ease.

                </p>
              </div>
              <div class="col-md-6">
                <img src="static/media/lp_bg.jpg" class="img-fluid" alt="Image Description" style="width: 100%; height: auto; max-width: 500px; max-height: 250px;">
            
                </div>
            </div>
          </div>
        </section>

        <section class="content-section light-bg" style="background-color: #f5f2f0;">
          <div class="container">
            <div class="row align-items-center" >
              <div class="col-md-6">
                <img src="static/media/lp_bg.jpg" class="img-fluid" alt="Image Description" style="width: 100%; height: auto; max-width: 500px; max-height: 250px;">
              </div>
              <div class="col-md-6">
                <h2>How to Buy Books</h2>
                <p>
Discovering and acquiring your next favorite book is a seamless experience with Bibliotheca. Begin by exploring our extensive collection of eBooks. Once you find a title that piques your interest, click the "Buy Now" button to initiate the purchase. After completing the payment process, the book will be instantly available for download as a PDF. Add this digital treasure to your collection and enjoy immediate access to your new read on any device.                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="ebook-covers" style="background-color: #f0f0f;">
          <h2>Explore Our eBook Collection</h2>
          <div class="row">
            <div class="col-md-4" v-for="ebook in ebooks" :key="ebook.id">
              <div class="card">
                <img :src="ebook.coverImage" class="card-img-top" alt="eBook Cover" style="height: 200px; object-fit: cover;">
                <div class="card-body">
                  <h5 class="card-title">{{ ebook.title }}</h5>
                  <p class="card-text">By {{ ebook.author }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

       
      </div>
      <div class = "quote" >
        
      <footer class="footer" style="background-color: #333; color: #fff; padding: 2rem 0;">
          <center> <p style="size:20px;">"A book is a dream that you hold in your hands." - Neil Gaiman.</p> </center>
              </footer>
      </div>
    </div>
  `,
  data() {
    return {
      ebooks: [
        {
          id: 1,
          title: 'Book Title 1',
          author: 'Author 1',
          coverImage: 'static/media/lp_bg.jpg'
        },
        {
          id: 2,
          title: 'Book Title 2',
          author: 'Author 2',
          coverImage: 'static/media/lp_bg.jpg'
        },
       
      ]
    };
  },
  methods: {
    
  },

};

export default Explore;
