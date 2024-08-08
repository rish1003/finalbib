const LogoutDialog = {
    template: `
      <div class="modal fade" id="logoutModal" tabindex="-1" role="dialog" aria-labelledby="logoutModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
          <div class="modal-content card">
            <div class="modal-header">
              <h5 class="modal-title" id="logoutModalLabel">Confirm Logout</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              Are you sure you want to logout?
            </div>
            <center>
            <div class="modal-footer">
            <button type="button" class="btn btn-primary" @click="confirmLogout">Logout</button>
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>

            </div>
            </center>
          </div>
        </div>
      </div>
    `,
    methods: {
      confirmLogout() {
        localStorage.clear();
        this.$emit('logoutConfirmed');
        if (this.$route.path !== '/') {
            this.$router.push('/'); 
          
        } else {
            window.location.reload(); 
        }
      }
    }
  };
  
  export default LogoutDialog;
  