import EbookCard from '../components/EbookCard.js'; 
import Navbar from '../components/Navbar.js';
import HeartIcon from '../components/HeartIcon.js';
const ReaderFeed = {
  data() {
    return {
      recentlyViewedBooks: [],
      posts: [
        {
          id: 1,
          user: 'Alice',
          content: 'Just finished reading "The Great Gatsby"',
          imageUrl: 'static/media/build.jpeg',
          timestamp: Date.now() - 100000,
          likes: 12,
          comments: [
            { id: 1, user: 'Bob', content: 'One of my favorites!' },
            { id: 2, user: 'Charlie', content: 'I love that book!' }
          ],
          showComments: false, 
          newComment: '', 
          likedUser: false
        },
        
      ], 
      showFriendRequestsDialog: false,
      
      friendRequests: [
        { id: 1, name: 'David', message: 'Wants to connect with you' },
        { id: 2, name: 'Eva', message: 'Sent you a friend request' }
      ],
      messages: [
        { id: 1, from: 'Grace', content: 'Hey! Have you read the latest book I recommended?' },
        { id: 2, from: 'Hank', content: 'Looking forward to our next book club meeting!' }
      ], 
      conversations: {
        1: [
          { from: 'Grace', content: 'Hey! Have you read the latest book I recommended?' },
          { from: 'You', content: 'Not yet, but it sounds interesting!' }
        ],
        2: [
          { from: 'Hank', content: 'Looking forward to our next book club meeting!' },
          { from: 'You', content: 'Me too! Can’t wait!' }
        ]},
      newPostContent: '',
      newPostImage: null,
      visibleBooks: [],
      startIndex: 0, 
      pageSize: 5,
      showFriendsListDialog: false,
      showFriends: false,
      showMessagesDialog: false,
      showConversationDialog: false,
    
      currentConversation: null,
      newMessage: '',
      selectedConversation: [],
    };
  },
  components: {
    EbookCard,
    Navbar,
    HeartIcon
  },
  methods: {
    fetchRecentlyViewedBooks() {
      const viewedBookIds = JSON.parse(localStorage.getItem('viewedBooks')) || [];
      
      if (viewedBookIds.length === 0) {
        return; 
      }

      fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: viewedBookIds })
      })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            console.error(data.error);
          } else {
            this.recentlyViewedBooks = data.books;
            this.updateVisibleBooks();
          }
        })
        .catch(error => {
          console.error('Error fetching books:', error);
        });
    },
    navigateToEbookDetail(ebookId) {
      let viewedBooks = JSON.parse(localStorage.getItem('viewedBooks')) || [];
  
      if (!viewedBooks.includes(ebookId)) {
        viewedBooks.unshift(ebookId);
        if (viewedBooks.length > 10) {
          viewedBooks.pop();
        }
        
        localStorage.setItem('viewedBooks', JSON.stringify(viewedBooks));
      }
      this.$router.push({ name: 'EbookDetailPage', params: { id: ebookId } });
    },
    updateVisibleBooks() {
      this.visibleBooks = this.recentlyViewedBooks.slice(this.startIndex, this.startIndex + this.pageSize);
    },
    showMore() {
      if (this.startIndex + this.pageSize < this.recentlyViewedBooks.length) {
        this.startIndex += this.pageSize;
        this.updateVisibleBooks();
      }
    },
    showLess() {
      if (this.startIndex >= this.pageSize) {
        this.startIndex -= this.pageSize;
        this.updateVisibleBooks();
      }
    },
    showMessages(){
      this.showMessagesDialog=true;
    },
    closeConversation(){
      this.selectedConversation =  [];
      this.showConversationDialog=false;
      this.showMessagesDialog = true; 
    },
    viewConversation(id) {
      this.selectedConversation = this.conversations[id] || [];
      this.showConversationDialog=true;
      this.showMessagesDialog = false; 
    },
    sendMessage() {
      if (this.newMessage.trim()) {
        this.selectedConversation.push({ from: 'You', content: this.newMessage });
        this.newMessage = ''; 
      }},
    showFriendsList() {
      this.showFriendsListDialog = true;
    },
    showRequests() {
      this.showFriendRequestsDialog = true;
    },
    viewFriend(name) {
      console.log(name);
    },
    likePost(postId) {
      const post = this.posts.find(p => p.id === postId);
      if (post) {
        post.likedUser = !post.likedUser;
        post.likes += post.likedUser ? 1 : -1;
      }
    },
    addComment(postId, comment) {
      const post = this.posts.find(p => p.id === postId);
      if (post) {
        post.comments.push({ id: post.comments.length + 1, user: 'You', content: comment });
        post.newComment = ''; 
      }
    },
    createPost() {
      if (this.newPostContent.trim() || this.newPostImage) {
        this.posts.unshift({
          id: this.posts.length + 1,
          user: 'You',
          content: this.newPostContent,
          imageUrl: this.newPostImage || null,
          timestamp: Date.now(),
          likes: 0,
          likedUser:false,
          comments: [],
          showComments: false
        });
        this.newPostContent = '';
        this.newPostImage = null;
      }
    },
    toggleComments(postId) {
      const post = this.posts.find(p => p.id === postId);
      if (post) {
        post.showComments = !post.showComments;
      }
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.newPostImage = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
   
  },
  created() {
    this.fetchRecentlyViewedBooks();
  },
  template: `
    <div class="reader-feed">
      <Navbar/>
      
      <div class="container">
     
        <div class="intro-section">
          <div class="intro-content">
            <h1 class="dashboard-title"><b>Reader Feed</b></h1>
            <p class="welcome-text">Continue your browsing or see what your fellow readers are up to!</p>
          </div>
        </div>
              <div class="right-sidebar">
          <button @click="showRequests" class="sidebar-btn">
            <img src="/static/media/assets/friendsadd.png" alt="Friend Requests" class="icon"/>
          </button>
          <button @click="showMessages" class="sidebar-btn">
            <img src="/static/media/assets/message.png" alt="Messages" class="icon"/>
          </button>
          <button @click="showFriendsList" class="sidebar-btn">
            <img src="/static/media/assets/friends.png" alt="Friends List" class="icon"/>
          </button>
        </div>

        <div v-if="showFriendRequestsDialog" class="dialog-box">
        <button class="close-btn" @click="showFriendRequestsDialog = false">X</button>
        <h4>Friend Requests</h4>
        <div v-if="friendRequests.length === 0">No friend requests.</div>
        <div v-else>
          <div v-for="request in friendRequests" :key="request.id" class="friend-tile">
            <p>{{ request.name }}</p>
            <div class="action-buttons">
              <button @click="acceptRequest(request.id)" class="accept-btn">✔️</button>
              <button @click="rejectRequest(request.id)" class="reject-btn">❌</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showMessagesDialog" class="dialog-box">
        <button class="close-btn" @click="showMessagesDialog = false">X</button>
        <h4>Messages</h4>
        <div v-if="messages.length === 0">No messages.</div>
        <div v-else>
          <div v-for="message in messages" :key="message.id" class="message-tile" @click="viewConversation(message.id)">
            <p>{{ message.from }}</p>
          </div>
        </div>
      </div>

            
        <div v-if="selectedConversation.length > 0" class="dialog-box">
          <button class="close-btn" @click="closeConversation">X</button>
          <h4>Conversation</h4>
           <div class="conversation">
            <div v-for="message in selectedConversation" :key="message.content" class="message" :class="{ 'from-user': message.from === 'You', 'from-other': message.from !== 'You' }">
              <p>{{ message.content }}</p>
            </div>
          </div>
          <div class="message-input">
            <input v-model="newMessage" placeholder="Type your message..." />
            <button @click="sendMessage">Send</button>
          </div>
        </div>

        
        <div v-if="showFriendsListDialog" class="dialog-box">
          <button class="close-btn" @click="showFriendsListDialog = false">X</button>
          <h4>Friends List</h4>
          <div v-if="friendRequests.length === 0">No friends found.</div>
          <div v-else>
            <div v-for="friend in friendRequests" :key="friend.id" class="friend-tile" @click="viewFriend(friend.name)">
              <p>{{ friend.name }}</p>
            </div>
          </div>
     
      </div>
        
        <div class="post-creation">
        <div class="submit-review">
          <textarea v-model="newPostContent" placeholder="What's on your mind?"></textarea>
          <input type="file" @change="handleFileUpload" />
          <button @click="createPost">Post</button>
        </div>
        </div>

      
        <div v-if="recentlyViewedBooks.length" class="continue-browsing">
          <h3 class="section-title">Continue Browsing</h3>
          <div class="scroll-container">
            <button v-if="startIndex > 0" class="arrow left-arrow" @click="showLess">&larr;</button>
            <div class="book-list">
              <EbookCard
                v-for="book in visibleBooks"
                :key="book.id"
                :name="book.name"
                :imageUrl="book.url"
                :author="book.author"
                :summary="book.summary"
                :id="book.id"
                @click="navigateToEbookDetail(book.id)"
              />
            </div>
            <button v-if="recentlyViewedBooks.length > pageSize && startIndex + pageSize < recentlyViewedBooks.length" class="arrow right-arrow" @click="showMore">&rarr;</button>
          </div>
        </div>

        <div class="posts-feed">
          <h3 class="section-title">Latest Posts</h3>
              <div v-for="post in posts" :key="post.id" class="post">
              <div class="post-box">
                    <div class="post-header">
                      <strong>{{ post.user }}</strong>
                      <p class="timestamp">{{ new Date(post.timestamp).toLocaleString() }}</p>
                    </div>
                <p v-if="post.content">{{ post.content }}</p>
                <img v-if="post.imageUrl" :src="post.imageUrl" class="post-image" />
               
                </div>
                <HeartIcon :isLiked="post.likedUser" @update:isLiked="likePost(post.id)" />
<button style="display: inline-block;background-color:transparent;  border: 2px solid black;  padding: 2px; " @click="likePost(post.id)">Likes ({{ post.likes }})</button>

                <button style="display: inline-block; border: 2px solid black; background-color:transparent; padding: 2px;" @click="toggleComments(post.id)">
                  Comments ({{ post.comments.length }})
                </button>
                      <div v-if="post.showComments" class="comments-section">
                              <div v-for="comment in post.comments" :key="comment.id" class="comment">
                                <strong>{{ comment.user }}</strong>: {{ comment.content }}
                              </div>
                        <input
                          v-model="post.newComment"
                          placeholder="Add a comment..."
                        />
                        <button @click="addComment(post.id, post.newComment)">Add Comment</button>
                      </div>
              </div>
        </div>
      </div>
    </div>
  `
};

export default ReaderFeed;
