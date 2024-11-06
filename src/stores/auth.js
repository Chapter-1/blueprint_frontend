import { defineStore } from 'pinia';
import axiosInstance from '@/util/axiosInstance';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    member: null,
    isAuthenticated: false,
  }),

  actions: {
    async login(memberId, password) {
      try {
        const response = await axiosInstance.post('/member/login', { memberId, password });
        console.log("login API 응답: ", response)
        if (response.data.success) {
          this.token = response.data.response.data.accessToken;
          this.isAuthenticated = true;

          this.setMemberFromToken();
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;

          return { success: true };
        } else {
          return { success: false, error: response.data.message };
        }
      } catch (error) {
        console.error('로그인 요청 오류:', error);
        return { success: false, error: '로그인 실패' };
      }
    },

    async register(memberToSend) {
      try {
        const response = await axiosInstance.post('/member/register', memberToSend);
        console.log("register API 응답: ", response)
        if (response.data.success) {
          this.token = response.data.response.data.accessToken;
          this.isAuthenticated = true;

          this.setMemberFromToken();
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;

          return { success: true };
        } else {
          return { success: false, error: response.data.message };
        }
      } catch (error) {
        console.error('회원가입 요청 오류:', error);
        return { success: false, error: '회원가입 실패' };
      }
    },

    setMemberFromToken() {
        const decoded = jwtDecode(this.token);
        this.member = {
          memberName: decoded.memberName,
          memberId: decoded.memberId,
        };
    },

    async checkMemberId(memberId) {
      try {
        const response = await axiosInstance.get(`/member/checkMemberId?memberId=${memberId}`);
        return response.data === false;
      } catch (error) {
        console.error('아이디 확인 중 오류 발생:', error);
        return false;
      }
    },
  
    async checkEmailDuplicate(email) {
      try {
        const response = await axiosInstance.get(`/member/checkEmail?email=${email}`);
        return response.data === false;
      } catch (error) {
        console.error('이메일 확인 중 오류 발생:', error);
        return false;
      }
    },

    async sendEmailVerification(email) {
      try {
        const response = await axiosInstance.post('/member/email/sendVerification', { email });
        return response.data && response.data.success;
      } catch (error) {
        console.error('이메일 인증 코드 전송 중 오류 발생:', error);
        return false;
      }
    },
    
    async verifyEmailCode(email, code) {
      try {
        const response = await axiosInstance.post('/member/email/verifyEmailCode', { email, code });
        return response.data && response.data === true;
      } catch (error) {
        console.error('이메일 인증 코드 확인 중 오류 발생:', error);
        return false;
      }
    },

    logout() {
      this.token = null;
      this.member = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
      delete axiosInstance.defaults.headers.common['Authorization'];
    },

    async fetchMyPage() {
      try {
        const response = await axiosInstance.get('/member/mypage');
        if (response.data.success) {
          this.member = response.data.member;
        } else {
          console.error('사용자 정보를 가져오지 못했습니다.');
        }
      } catch (error) {
        console.error('사용자 정보 요청 오류:', error);
      }
    },
  },
  
  getters: {
    isLoggedIn() {
      return this.isAuthenticated;
    },
  },
  
  persist: {
    enabled: true,
    strategies: [
      {
        storage: localStorage,
        paths: ['token'],
      },
    ],
  },
});
