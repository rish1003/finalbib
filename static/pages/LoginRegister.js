import Navbar from "../components/Navbar.js";

const LoginRegister = {
  template: `
    <div>
    <Navbar />
    
    <div class="wrapper row" style="background-color:white;">
    
        <div class="col-md-12">
        <center> <div class="text-danger">{{error}}</div> </center>
            <div class="card-toggle">
                <span :class="{ active: isLogin }" @click="setLogin(true)">Log in</span>
                <span :class="{ active: !isLogin }" @click="setLogin(false)">Sign Up</span>
            </div>
            <div class="flip-card" :class="{ 'flipped': !isLogin }"  style="margin-left: 25%;">
                <div class="flip-card__inner">
                <div class="flip-card__front">
                    <div class="form-label">Log in</div>
                    <form class="flip-card__form" @submit.prevent="handleLogin">
                    <input v-model="loginEmail" class="flip-card__input" name="email" placeholder="Email" type="email" required />
                    <input v-model="loginPassword" class="flip-card__input" name="password" placeholder="Password" type="password" required />
                    <button class="flip-card__btn">Let's go!</button>
                    </form>
                </div>
        
                <div class="flip-card__back">
                    <div class="form-label">Sign Up</div>
                    <form class="flip-card__form" @submit.prevent="handleSignup">
                    <input v-model="signupName" class="flip-card__input" name="username" placeholder="User Name" type="text" required /> 
                    <input v-model="signupEmail" class="flip-card__input" name="email" placeholder="Email" type="email" required />
                    <input v-model="signupPassword" class="flip-card__input" name="password" placeholder="Password" type="password" required />
                    <input v-model="confirmPassword" class="flip-card__input" name="confirmpassword" placeholder="Confirm Password" type="password" required />
                    <button class="flip-card__btn">Confirm!</button>
                    </form>
                </div>
            </div>
         </div>
        </div>
    </div>
  </div>
  `,
  data() {
    return {
      isLogin: true,
      loginEmail: '',
      loginPassword: '',
      signupName: '',
      signupEmail: '',
      signupPassword: '',
      
      confirmPassword: '',
      passwordRules: [
        (value) => !!value || 'Please type password.',
        (value) => (value && value.length >= 6) || 'minimum 6 characters',
      ],
      confirmPasswordRules: [
        (value) => !!value || 'type confirm password',
        (value) =>
          value === this.password || 'The password confirmation does not match.',
      ],
      error: ''
    };
  },
  components: {
    Navbar
  },
  methods: {
  setLogin(isLogin) {
    this.isLogin = isLogin;
    this.error = '';
  },
  
    async handleLogin() {
      const url = `${window.location.origin}/userlogin`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: this.loginEmail,
          password: this.loginPassword,
          username: this.signupName

        })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.roles);
        localStorage.setItem("email", data.email);
        localStorage.setItem("id", data.id);
        console.log(data)
        console.log(data.roles)
        this.$router.push("/");
      } else {
        const data = await res.json();
        this.error = data["message"]
        console.error("Login Failed");
      }
    },
    async handleSignup() {
      const url = `${window.location.origin}/userregis`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: this.signupName,
          email: this.signupEmail,
          password: this.signupPassword
        })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.roles);
        localStorage.setItem("email", data.email);
        localStorage.setItem("id", data.id);
        console.log(data)
        this.$router.push("/");
      } else {
        const data = await res.json();
        this.error = data["message"];
        console.error("Signup Failed");
      }
    }
  }
};

export default LoginRegister;
