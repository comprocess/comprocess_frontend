// Navigation
function navigateTo(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    document.getElementById(sectionId).classList.add('active');
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const targetLink = document.querySelector(`a[href="#${sectionId}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Setup navigation
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            navigateTo(sectionId);
        });
    });
});

// Utility Functions
function showLoading(button) {
    button.disabled = true;
    button.querySelector('.btn-text').style.display = 'none';
    button.querySelector('.btn-loading').style.display = 'inline';
}

function hideLoading(button) {
    button.disabled = false;
    button.querySelector('.btn-text').style.display = 'inline';
    button.querySelector('.btn-loading').style.display = 'none';
}

function showError(container, message) {
    container.innerHTML = `
        <div class="alert alert-error">
            <strong>오류:</strong> ${message}
        </div>
    `;
}

// Travel Plan Form Handler
document.getElementById('travel-plan-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
    const resultContainer = document.getElementById('travel-plan-result');
    
    showLoading(button);
    resultContainer.innerHTML = '<p class="placeholder">일정을 생성하고 있습니다...</p>';
    
    const data = {
        destination: document.getElementById('destination').value,
        budget: document.getElementById('budget').value,
        travel_date: document.getElementById('travel_date').value,
        preferences: document.getElementById('preferences').value,
        extra: document.getElementById('extra').value,
    };
    
    try {
        const result = await API.createTravelPlan(data);
        displayTravelPlanResult(result, resultContainer);
    } catch (error) {
        showError(resultContainer, error.message);
    } finally {
        hideLoading(button);
    }
});

function displayTravelPlanResult(result, container) {
    console.log('API Response:', result);
    
    const { input, ai_result } = result;
    
    if (!ai_result) {
        showError(container, 'AI 응답 데이터가 없습니다.');
        return;
    }
    
    const { destination, date, travelers, preferences, itinerary, costs } = ai_result;
    
    let html = `
        <div class="result-content">
            <div class="result-header">
                <h3>🗺️ ${destination} 여행 일정</h3>
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <strong>📍 목적지</strong>
                    <span>${destination}</span>
                </div>
                <div class="info-item">
                    <strong>📅 여행 기간</strong>
                    <span>${date.start} ~ ${date.end} (${date.days}일)</span>
                </div>
                <div class="info-item">
                    <strong>👥 여행자</strong>
                    <span>${travelers.count}명</span>
                </div>
                <div class="info-item">
                    <strong>💰 총 예상 비용</strong>
                    <span>₩${costs.total_krw.toLocaleString()} (${costs.currency} ${costs.total_local.toLocaleString()})</span>
                </div>
                ${preferences.themes && preferences.themes.length > 0 ? `
                <div class="info-item">
                    <strong>🎯 선호 테마</strong>
                    <span>${preferences.themes.join(', ')}</span>
                </div>` : ''}
            </div>
    `;
    
    // 일정 표시
    if (itinerary && Array.isArray(itinerary)) {
        itinerary.forEach(dayPlan => {
            html += `
                <div class="schedule-day">
                    <h4>📅 Day ${dayPlan.day}</h4>
            `;
            
            if (dayPlan.segments && Array.isArray(dayPlan.segments)) {
                dayPlan.segments.forEach(segment => {
                    const costKrw = Math.round(segment.cost_local * (costs.total_krw / costs.total_local));
                    html += `
                        <div class="activity-item">
                            <div class="activity-time">⏰ ${segment.time}</div>
                            <div class="activity-location">📍 ${segment.poi}</div>
                            <div class="activity-description"><strong>${segment.title}</strong></div>
                            <div style="display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap;">
                                <span style="color: var(--text-light);">🚇 ${segment.transport}</span>
                                <span style="color: var(--text-light);">⏱️ ${segment.duration_min}분</span>
                                <span class="activity-cost">💰 약 ₩${costKrw.toLocaleString()}</span>
                                ${segment.booking_needed ? '<span style="color: var(--danger-color);">📝 예약 필요</span>' : ''}
                            </div>
                        </div>
                    `;
                });
            }
            
            html += `</div>`;
        });
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

// Image Analyze Form Handler
document.getElementById('analyze-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('analyze-preview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            preview.classList.add('active');
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
        preview.classList.remove('active');
    }
});

document.getElementById('image-analyze-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
    const resultContainer = document.getElementById('image-analyze-result');
    
    const fileInput = document.getElementById('analyze-image');
    if (!fileInput.files[0]) {
        showError(resultContainer, '이미지를 선택해주세요.');
        return;
    }
    
    showLoading(button);
    resultContainer.innerHTML = '<p class="placeholder">이미지를 분석하고 있습니다...</p>';
    
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    
    try {
        const result = await API.analyzeImage(formData);
        displayImageAnalyzeResult(result, resultContainer);
    } catch (error) {
        showError(resultContainer, error.message);
    } finally {
        hideLoading(button);
    }
});

function displayImageAnalyzeResult(result, container) {
    console.log('Image Analysis Response:', result);
    
    const { image_info, ai_analysis } = result;
    
    if (!ai_analysis || !ai_analysis.success) {
        showError(container, 'AI 분석에 실패했습니다.');
        return;
    }
    
    const data = ai_analysis.data;
    const imageUrl = `http://127.0.0.1:8000${image_info.image}`;
    
    let html = `
        <div class="result-content">
            <div class="result-header">
                <h3>🔍 이미지 분석 완료!</h3>
            </div>
            
            <img src="${imageUrl}" alt="분석된 이미지" class="analysis-image">
            
            <div class="analysis-type">${data.type}</div>
    `;
    
    if (data.type === '음식') {
        html += `
            <div class="analysis-details">
                <h4>🍽️ 음식명</h4>
                <p>${data.음식명}</p>
                
                ${data.대부분_들어가있는_재료 ? `
                <h4>🥘 주요 재료</h4>
                <ul>
                    ${data.대부분_들어가있는_재료.map(ingredient => `<li>${ingredient}</li>`).join('')}
                </ul>
                ` : ''}
                
                <h4>📖 음식 설명</h4>
                <p>${data.음식에_대한_설명}</p>
                
                ${data.음식_특징 ? `
                <h4>✨ 맛의 특징</h4>
                <p>${data.음식_특징}</p>
                ` : ''}
            </div>
        `;
    } else if (data.type === '관광지' || data.type === '장소') {
        html += `
            <div class="analysis-details">
                <h4>📍 장소 이름</h4>
                <p>${data.장소_이름}</p>
                
                <h4>📖 장소 설명</h4>
                <p>${data.장소에_대한_설명}</p>
                
                ${data.장소에_대한_특징 ? `
                    <h4>✨ 특징</h4>
                    <p>${data.장소에_대한_특징}</p>
                ` : ''}
                
                ${data.역사적_의미 ? `
                    <h4>🏛️ 역사적 의미</h4>
                    <p>${data.역사적_의미}</p>
                ` : ''}
            </div>
        `;
    } else if (data.type === '기타') {
        html += `
            <div class="analysis-details">
                <div class="alert alert-error" style="margin-top: 1rem;">
                    <strong>⚠️ 한국 관광지/음식이 아닙니다</strong>
                    <p style="margin-top: 0.5rem;">${data.설명}</p>
                </div>
                <p style="margin-top: 1rem; color: var(--text-light);">
                    이 서비스는 한국의 관광지나 음식 이미지 분석에 특화되어 있습니다.
                </p>
            </div>
        `;
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

// Exchange Rate Form Handler
document.getElementById('exchange-rate-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
    const resultContainer = document.getElementById('exchange-rate-result');
    
    showLoading(button);
    resultContainer.innerHTML = '<p class="placeholder">환율을 예측하고 있습니다...</p>';
    
    const data = {
        year: parseInt(document.getElementById('year').value),
        month: parseInt(document.getElementById('month').value),
        country: document.getElementById('country').value,
    };
    
    try {
        const result = await API.predictExchangeRate(data);
        displayExchangeRateResult(result, resultContainer);
    } catch (error) {
        showError(resultContainer, error.message);
    } finally {
        hideLoading(button);
    }
});

function displayExchangeRateResult(result, container) {
    if (!result.success) {
        showError(container, '환율 예측에 실패했습니다.');
        return;
    }
    
    const changeClass = result.change_direction === '상승' ? 'up' : 'down';
    const changeIcon = result.change_direction === '상승' ? '📈' : '📉';
    const countryFlag = result.country === '미국' ? '🇺🇸' : '🇯🇵';
    
    const html = `
        <div class="result-content">
            <div class="result-header">
                <h3>💱 환율 예측 결과</h3>
            </div>
            
            <div class="rate-card">
                <div>${countryFlag} ${result.country} ${result.currency}</div>
                <div class="rate-value">₩${result.predicted_rate.toLocaleString()}</div>
                <div>${result.year}년 ${result.month}월 예측 환율</div>
                <div class="rate-change ${changeClass}">
                    ${changeIcon} ${result.change_direction} ${Math.abs(result.change_rate)}%
                </div>
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <strong>현재 환율</strong>
                    <span>₩${result.latest_rate ? result.latest_rate.toLocaleString() : 'N/A'}</span>
                </div>
                <div class="info-item">
                    <strong>기준일</strong>
                    <span>${result.latest_date || 'N/A'}</span>
                </div>
                ${result.months_ahead ? `
                    <div class="info-item">
                        <strong>예측 기간</strong>
                        <span>${result.months_ahead}개월 후</span>
                    </div>
                ` : ''}
            </div>
            
            ${result.note ? `
                <div class="alert alert-success">
                    ${result.note}
                </div>
            ` : ''}
        </div>
    `;
    
    container.innerHTML = html;
}
