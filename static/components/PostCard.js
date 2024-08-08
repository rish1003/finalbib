const PostCard = {
    props: ['post'],
    template: `
      <div class="post-card">
        <div class="post-user">{{ post.user }}</div>
        <div class="post-content">{{ post.content }}</div>
      </div>
    `
  };
  
  export default PostCard;
  