// API Base URL
const API_BASE_URL = 'http://127.0.0.1:8000/comprocessSW';

// Bearer Token 관리
const Auth = {
    getToken() {
        return localStorage.getItem('access_token');
    },
    
    getRefreshToken() {
        return localStorage.getItem('refresh_token');
    },
    
    setTokens(accessToken, refreshToken) {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
    },
    
    clearTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
    },
    
    isAuthenticated() {
        return !!this.getToken();
    },
    
    setUserInfo(userId, username) {
        localStorage.setItem('user_id', userId);
        localStorage.setItem('username', username);
    },
    
    getUserInfo() {
        return {
            userId: localStorage.getItem('user_id'),
            username: localStorage.getItem('username')
        };
    }
};

// API Client
const API = {
    // 공통 헤더 생성
    getHeaders(includeAuth = false) {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (includeAuth && Auth.isAuthenticated()) {
            const token = Auth.getToken();
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Authorization header:', headers['Authorization']); // 디버깅
        }
        
        return headers;
    },

    // 회원가입
    async register(username, password) {
        const response = await fetch(`${API_BASE_URL}/register/`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ username, password }),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.username?.[0] || error.detail || '회원가입에 실패했습니다.');
        }
        
        return await response.json();
    },

    // 로그인
    async login(username, password) {
        const response = await fetch(`${API_BASE_URL}/login/`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ username, password }),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || '로그인에 실패했습니다.');
        }
        
        const data = await response.json();
        console.log('Login response:', data); // 디버깅
        Auth.setTokens(data.access, data.refresh);
        Auth.setUserInfo(data.id, data.username);
        return data;
    },

    // 토큰 갱신
    async refreshToken() {
        const refreshToken = Auth.getRefreshToken();
        if (!refreshToken) {
            throw new Error('리프레시 토큰이 없습니다.');
        }
        
        const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ refresh: refreshToken }),
        });
        
        if (!response.ok) {
            Auth.clearTokens();
            throw new Error('토큰 갱신에 실패했습니다.');
        }
        
        const data = await response.json();
        Auth.setTokens(data.access, Auth.getRefreshToken());
        return data;
    },

    // 인증이 필요한 요청을 처리하는 공통 메서드 (토큰 만료 시 자동 갱신)
    async authenticatedFetch(url, options = {}) {
        const token = Auth.getToken();
        if (!token) {
            throw new Error('로그인이 필요합니다.');
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };
        
        let response = await fetch(url, { ...options, headers });
        
        // 401 에러 (토큰 만료) 시 토큰 갱신 시도
        if (response.status === 401) {
            console.log('Token expired, attempting to refresh...');
            try {
                await this.refreshToken();
                // 새 토큰으로 다시 요청
                const newToken = Auth.getToken();
                headers['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(url, { ...options, headers });
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                Auth.clearTokens();
                throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
            }
        }
        
        return response;
    },

    // 현재 유저 정보 조회
    async getMyInfo() {
        console.log('=== getMyInfo ===');
        console.log('Token:', Auth.getToken());
        
        const response = await this.authenticatedFetch(`${API_BASE_URL}/user/me/`, {
            method: 'GET',
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Get my info error:', response.status, errorText);
            throw new Error('유저 정보 조회에 실패했습니다.');
        }
        
        return await response.json();
    },

    // 내 여행 일정 내역 조회
    async getMyTravelHistory() {
        const response = await this.authenticatedFetch(`${API_BASE_URL}/user/me/travel-history/`, {
            method: 'GET',
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Get travel history error:', response.status, errorText);
            throw new Error('여행 내역 조회에 실패했습니다.');
        }
        
        return await response.json();
    },

    // 특정 여행 일정 상세 조회
    async getTravelPlanDetail(scheduleId) {
        const response = await this.authenticatedFetch(`${API_BASE_URL}/travel-plan/${scheduleId}/`, {
            method: 'GET',
        });
        
        if (!response.ok) {
            throw new Error('여행 일정 조회에 실패했습니다.');
        }
        
        return await response.json();
    },

    // 계정 수정
    async updateAccount(userId, currentPassword, newUsername, newPassword) {
        const body = { current_password: currentPassword };
        if (newUsername) body.new_username = newUsername;
        if (newPassword) body.new_password = newPassword;
        
        const token = Auth.getToken();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        
        const response = await fetch(`${API_BASE_URL}/user/${userId}/`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(body),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || '계정 수정에 실패했습니다.');
        }
        
        return await response.json();
    },

    // 계정 삭제
    async deleteAccount(username, password) {
        const token = Auth.getToken();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        
        const response = await fetch(`${API_BASE_URL}/user/delete/`, {
            method: 'DELETE',
            headers: headers,
            body: JSON.stringify({ username, password }),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || '계정 삭제에 실패했습니다.');
        }
        
        return await response.json();
    },

    // 여행 일정 생성
    async createTravelPlan(data) {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (Auth.isAuthenticated()) {
            const token = Auth.getToken();
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Travel Plan - Token:', token);
        }
        
        const response = await fetch(`${API_BASE_URL}/travel-plan/`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error('여행 일정 생성에 실패했습니다.');
        }
        
        return await response.json();
    },

    // 이미지 분석
    async analyzeImage(formData) {
        const headers = {};
        if (Auth.isAuthenticated()) {
            headers['Authorization'] = `Bearer ${Auth.getToken()}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/image-analyze/`, {
            method: 'POST',
            headers: headers,
            body: formData,
        });
        
        if (!response.ok) {
            throw new Error('이미지 분석에 실패했습니다.');
        }
        
        return await response.json();
    },

    // 환율 예측
    async predictExchangeRate(data) {
        const response = await fetch(`${API_BASE_URL}/exchange-rate-predict/`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error('환율 예측에 실패했습니다.');
        }
        
        return await response.json();
    },
};
