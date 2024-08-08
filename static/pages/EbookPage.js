import Modal from "../components/Modal.js";
import PdfReader from "../components/EbookViewer.js";
import Navbar from "../components/Navbar.js";

const EbookDetails = {
  props: {
    id: String,
    
  },
  data() {
    return {
      showPdfReader: false,
      ebook: null,
      reviews: [],
      averageRating: 0,
      ratingBreakdown: {},
      isLoading: true,
      error: null,
      newReview: {
        rating: 5,
        comment: ''
      },
      selectedRating: 0,
      maxCount: 0,
      isModalVisible: false,
      pdfUrl: ''
   
    };
  },
  components: {
    Navbar,
    PdfReader,
    Modal,
  },
  methods: {
    setRating(star) {
      this.newReview['rating'] = star;
      this.selectedRating = star;
    },
    fetchBookDetails() {
      const userId = localStorage.getItem('id');
      
      fetch(`/fetch/ebook/${this.id}?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
          this.ebook = data;
          this.isLoading = false;
          this.fetchReviews();
        })
        .catch(error => {
          console.error('Error fetching book details:', error);
          this.error = 'Failed to load book details. Please try again later.';
          this.isLoading = false;
        });
    },
    handleReturnBook() {
      const userId = localStorage.getItem('id');
      fetch(`/return_book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ebook_id: this.id, user_id: userId })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.fetchBookDetails();
        } else {
          console.error('Error returning book:', data.message);
        }
      })
      .catch(error => {
        console.error('Error returning book:', error);
      });
    },
    handleAction(action) {
      console.log(`${action} clicked`);
    },
    fetchReviews() {
      fetch(`/fetch/reviews/${this.id}`)
        .then(response => response.json())
        .then(data => {
          this.reviews = data.reviews;
          this.averageRating = data.average_rating;
          this.ratingBreakdown = data.rating_breakdown;
          this.maxCount = Math.max(...Object.values(this.ratingBreakdown), 0); 
        })
        .catch(error => {
          console.error('Error fetching reviews:', error);
          this.error = 'Failed to load reviews. Please try again later.';
        });
    },
    handleReviewSubmit() {
      const userId = localStorage.getItem('id');
      const { rating, comment } = this.newReview;

      if (rating === 0 || comment.trim() === '') {
        alert('Please select a rating and write a review.');
        return;
      }

      fetch(`/submit/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ebook_id: this.id, user_id: userId, rating: rating, comment: comment })
      })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            alert(data.error); 
            this.newReview = { rating: null, comment: '' }; 
            this.selectedRating = 0;
          } else {
            this.fetchBookDetails(); 
            this.newReview = { rating: null, comment: '' }; 
            this.selectedRating = 0;
          }
        })
        .catch(error => {
          console.error('Error submitting review:', error);
        });
    },
    openPdfReader(url) {
      this.pdfUrl = url;
      this.isModalVisible = true;
    },
    readBook() {
      console.log(this.bookUrl);
      const bookUrl =  this.bookUrl || 'default_book.pdf'; 
      window.open(`static/media/uploads/books/${bookUrl}`, '_blank');
      
    },
    
    handleRequestBook() {
      const userId = localStorage.getItem('id');
      fetch(`/request_borrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ebook_id: this.id, user_id: userId })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert(data.success);
            this.fetchBookDetails();  
          } else {
            alert(data.error);
          }
        })
        .catch(error => {
          console.error('Error requesting to borrow the book:', error);
        });
    }
  
  },
  computed: {
    ratingChartData() {
      return {
        labels: Object.keys(this.ratingBreakdown).map(rating => `${rating} stars`),
        datasets: [{
          label: 'Number of Reviews',
          data: Object.values(this.ratingBreakdown),
          backgroundColor: '#42A5F5',
          borderColor: '#1E88E5',
          borderWidth: 1
        }]
      };
    }
  },
  created() {
    this.fetchBookDetails();
  },
  template: `
    <div class="details-page">
      <Navbar />
      <PdfReader v-if="showPdfReader" />
      <div class="details">
        <div class="details-card">
          <div class="details-content">
            <div class="details-image">
              <img :src="ebook?.url" alt="Book Cover" />
            </div>
            <div class="details-text">
              <h3 class="details-title">{{ ebook?.name }}</h3>
              <br/>
              <p class="details-author"><b>Author(s):</b> {{ ebook?.author }}</p>
              <p class="details-pages"><b>Pages:</b> {{ ebook?.num_pages }}</p>
              <p class="details-summary"><b>Summary:</b> {{ ebook?.summary }}</p><br/><br/>
              <p v-if="ebook?.status">
                <b>Days left to return:</b> {{ ebook.days_left }}
              </p>
                     <modal 
        :title="'PDF Reader'"
        :visible="isModalVisible"
        @close="isModalVisible = false"
      >
        <pdf-reader :pdfUrl="pdfUrl"></pdf-reader> </modal>
              <div class="details-button-container">
                <button v-if="ebook?.status" class="details-action-button" @click="handleReturnBook">Return Book</button>
                <a v-if="ebook?.status || ebook?.bought" class="details-action-button" @click="readBook"> Read</a>
                <button v-if="!ebook.issued || ebook.return && !ebook.bought" class="details-action-button" @click="handleRequestBook">Request for Borrow</button>
                <button v-if="ebook.issued && !ebook.status && !ebook.bought && !ebook.return" class="details-action-button">Request Sent</button>
                <a v-if="ebook?.bought" class="details-action-button" :href="'static/media/uploads/books/' + ebook.bookurl" download> Download</a>

                <button v-if="!ebook?.bought" class="details-action-button">Buy</button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!isLoading">
          <div class="reviews-section">
            <div class="reviews-breakdown">
              <p><b>Average Rating:</b> {{ averageRating }} / 5</p>
              <div v-if="Object.keys(ratingBreakdown).length">
                <div class="rating-chart">
                  <div v-for="(count, rating) in ratingBreakdown" :key="rating" class="rating-bar">
                    <span class="rating-label">{{ rating }} stars</span>
                    <div class="bar-container">
                      <div class="bar" :style="{ width: (count / maxCount * 100) + '%' }"></div>
                    </div>
                    <span class="rating-count">{{ count }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="submit-review">
              <h4>Submit Your Review</h4>
              <div class="star-rating">
                <i
                  v-for="star in 5"
                  :key="star"
                  :class="['fa', 'fa-star', {'filled': star <= selectedRating}]"
                  @click="setRating(star)"
                  aria-hidden="true"
                ></i>
              </div>
              <textarea v-model="newReview.comment" placeholder="Write your review here..."></textarea>
              <button @click="handleReviewSubmit">Submit Review</button>
            </div>
            <div class="reviews-list">
              <h4>Reviews</h4>
              <div v-if="reviews.length === 0" class="no-reviews">No reviews yet. Be the first to leave a review!</div>
              <div v-else>
                <div v-for="review in reviews" :key="review.id" class="review-card">
                  <div class="review-stars">
                    <i v-for="star in 5" :key="star" :class="['fa', 'fa-star', {'filled': star <= review.rating}]" aria-hidden="true"></i>
                  </div>
                  <div class="review-text">
                    <p><b>{{ review.username }}</b></p>
                    <p>{{ review.comment }}</p>
                  </div>
                  <div class="review-date">
                    <p>{{ review.created_at }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <center>
          <div v-if="isLoading" class="loading">
            <div class="spinner">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        </center>
        <div v-if="error" class="error">{{ error }}</div>
      </div>
    </div>
  `,
  
};

export default EbookDetails;