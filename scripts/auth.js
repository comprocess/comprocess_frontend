// Auth and MyPage handlers

// Login Form Handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    showLoading(button);
    
    try {
        const result = await API.login(username, password);
        alert(`환영합니다, ${result.username}님!`);
        updateAuthUI();
        navigateTo('home');
        e.target.reset();
    } catch (error) {
        alert(`로그인 실패: ${error.message}`);
    } finally {
        hideLoading(button);
    }
});

// Register Form Handler
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    
    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    showLoading(button);
    
    try {
        const result = await API.register(username, password);
        alert('회원가입이 완료되었습니다! 로그인해주세요.');
        navigateTo('login');
        e.target.reset();
    } catch (error) {
        alert(`회원가입 실패: ${error.message}`);
    } finally {
        hideLoading(button);
    }
});

// Load My Page Data
async function loadMyPageData() {
    const userInfoContent = document.getElementById('user-info-content');
    const travelHistoryContent = document.getElementById('travel-history-content');
    
    // 디버깅: 토큰 확인
    console.log('=== MyPage Debug ===');
    console.log('Is Authenticated:', Auth.isAuthenticated());
    console.log('Access Token:', Auth.getToken());
    console.log('User Info:', Auth.getUserInfo());
    console.log('==================');
    
    // 로딩 상태 표시
    userInfoContent.innerHTML = '<p class="placeholder">정보를 불러오는 중...</p>';
    travelHistoryContent.innerHTML = '<p class="placeholder">여행 내역을 불러오는 중...</p>';
    
    try {
        // Load user info
        const userInfo = await API.getMyInfo();
        userInfoContent.innerHTML = `
            <div class="user-info-item">
                <strong>아이디</strong>
                <span>${userInfo.username}</span>
            </div>
            <div class="user-info-item">
                <strong>가입일</strong>
                <span>${new Date(userInfo.created_at).toLocaleDateString('ko-KR')}</span>
            </div>
            <div class="user-info-item">
                <strong>최근 수정일</strong>
                <span>${new Date(userInfo.updated_at).toLocaleDateString('ko-KR')}</span>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load user info:', error);
        userInfoContent.innerHTML = `<div class="alert alert-error">정보를 불러오는데 실패했습니다.<br>${error.message}</div>`;
    }
    
    try {
        // Load travel history
        const history = await API.getMyTravelHistory();
        
        if (history.count === 0) {
            travelHistoryContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>아직 생성한 여행 일정이 없습니다.</p>
                    <button class="btn btn-primary" onclick="navigateTo('travel-plan')" style="margin-top: 1rem; width: auto;">
                        여행 일정 만들기
                    </button>
                </div>
            `;
        } else {
            let historyHtml = `<p style="margin-bottom: 1rem; color: var(--text-light);">총 ${history.count}개의 여행 일정</p>`;
            
            history.schedules.forEach(schedule => {
                historyHtml += `
                    <div class="travel-history-item">
                        <h4>${schedule.destination}</h4>
                        <div class="travel-history-info">
                            <div class="travel-history-info-item">
                                <span>💰</span>
                                <span>${schedule.budget}</span>
                            </div>
                            <div class="travel-history-info-item">
                                <span>📅</span>
                                <span>${schedule.travel_date}</span>
                            </div>
                            <div class="travel-history-info-item">
                                <span>🎯</span>
                                <span>${schedule.preferences}</span>
                            </div>
                            <div class="travel-history-info-item">
                                <span>📝</span>
                                <span>${new Date(schedule.created_at).toLocaleDateString('ko-KR')}</span>
                            </div>
                        </div>
                        <button class="btn-view-detail" onclick="viewTravelDetail(${schedule.id})">
                            상세 보기
                        </button>
                    </div>
                `;
            });
            
            travelHistoryContent.innerHTML = historyHtml;
        }
    } catch (error) {
        console.error('Failed to load travel history:', error);
        travelHistoryContent.innerHTML = `<div class="alert alert-error">여행 내역을 불러오는데 실패했습니다.<br>${error.message}</div>`;
        
        if (error.message.includes('인증') || error.message.includes('토큰') || error.message.includes('유저 정보')) {
            Auth.clearTokens();
            updateAuthUI();
            setTimeout(() => {
                alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
                navigateTo('login');
            }, 500);
        }
    }
}

// View Travel Detail
async function viewTravelDetail(scheduleId) {
    try {
        const detail = await API.getTravelPlanDetail(scheduleId);
        
        // 여행 일정 페이지로 이동하고 결과 표시
        navigateTo('travel-plan');
        const resultContainer = document.getElementById('travel-plan-result');
        displayTravelPlanResult({ input: detail, ai_result: detail.ai_result }, resultContainer);
    } catch (error) {
        alert(`여행 일정을 불러오는데 실패했습니다: ${error.message}`);
    }
}

// Modal Functions
function showUpdateAccountModal() {
    document.getElementById('update-account-modal').style.display = 'flex';
}

function closeUpdateAccountModal() {
    document.getElementById('update-account-modal').style.display = 'none';
    document.getElementById('update-account-form').reset();
}

function showDeleteAccountModal() {
    document.getElementById('delete-account-modal').style.display = 'flex';
}

function closeDeleteAccountModal() {
    document.getElementById('delete-account-modal').style.display = 'none';
    document.getElementById('delete-account-form').reset();
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const updateModal = document.getElementById('update-account-modal');
    const deleteModal = document.getElementById('delete-account-modal');
    
    if (e.target === updateModal) {
        closeUpdateAccountModal();
    }
    if (e.target === deleteModal) {
        closeDeleteAccountModal();
    }
});

// Update Account Form Handler
document.getElementById('update-account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
    const currentPassword = document.getElementById('update-current-password').value;
    const newUsername = document.getElementById('update-new-username').value;
    const newPassword = document.getElementById('update-new-password').value;
    const newPasswordConfirm = document.getElementById('update-new-password-confirm').value;
    
    // 새 비밀번호 확인
    if (newPassword && newPassword !== newPasswordConfirm) {
        alert('새 비밀번호가 일치하지 않습니다.');
        return;
    }
    
    // 변경 사항이 없으면
    if (!newUsername && !newPassword) {
        alert('변경할 정보를 입력해주세요.');
        return;
    }
    
    showLoading(button);
    
    try {
        const userInfo = Auth.getUserInfo();
        const result = await API.updateAccount(userInfo.userId, currentPassword, newUsername, newPassword);
        
        alert('정보가 수정되었습니다.');
        
        // 아이디가 변경되었으면 다시 로그인 필요
        if (newUsername) {
            Auth.clearTokens();
            updateAuthUI();
            closeUpdateAccountModal();
            alert('아이디가 변경되어 다시 로그인해야 합니다.');
            navigateTo('login');
        } else {
            closeUpdateAccountModal();
            loadMyPageData(); // 정보 새로고침
        }
    } catch (error) {
        alert(`정보 수정 실패: ${error.message}`);
    } finally {
        hideLoading(button);
    }
});

// Delete Account Form Handler
document.getElementById('delete-account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
    const username = document.getElementById('delete-username').value;
    const password = document.getElementById('delete-password').value;
    
    const userInfo = Auth.getUserInfo();
    
    // 아이디 확인
    if (username !== userInfo.username) {
        alert('아이디가 일치하지 않습니다.');
        return;
    }
    
    // 최종 확인
    if (!confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        return;
    }
    
    showLoading(button);
    
    try {
        await API.deleteAccount(username, password);
        
        alert('계정이 삭제되었습니다. 이용해주셔서 감사합니다.');
        Auth.clearTokens();
        updateAuthUI();
        closeDeleteAccountModal();
        navigateTo('home');
    } catch (error) {
        alert(`계정 삭제 실패: ${error.message}`);
    } finally {
        hideLoading(button);
    }
});
