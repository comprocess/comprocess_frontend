// API Base URL
const API_BASE_URL = 'http://127.0.0.1:8000/comprocessSW';

// API Client
const API = {
    // 여행 일정 생성
    async createTravelPlan(data) {
        const response = await fetch(`${API_BASE_URL}/travel-plan/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error('여행 일정 생성에 실패했습니다.');
        }
        
        return await response.json();
    },

    // 이미지 분석
    async analyzeImage(formData) {
        const response = await fetch(`${API_BASE_URL}/image-analyze/`, {
            method: 'POST',
            body: formData, // FormData는 Content-Type을 자동으로 설정
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error('환율 예측에 실패했습니다.');
        }
        
        return await response.json();
    },
};
