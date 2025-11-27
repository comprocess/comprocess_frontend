# Comprocess Travel Frontend

AI 기반 여행 플래너 프론트엔드 (순수 HTML/CSS/JavaScript)

## 🚀 기능

### 1. 🗺️ 여행 일정 생성
- 목적지, 예산, 날짜, 선호사항을 입력하면 AI가 맞춤형 여행 일정을 생성합니다

### 2. 🔍 이미지 분석
- 한국 관광지나 음식 사진을 업로드하면 AI가 분석해드립니다

### 3. 💱 환율 예측
- 년도, 월, 국가를 입력하면 AI가 환율을 예측합니다
- 지원 국가: 🇺🇸 미국(USD), 🇯🇵 일본(JPY)

## 📁 프로젝트 구조

```
comprocess_frontend/
├── index.html          # 메인 HTML 파일
├── styles/
│   └── main.css       # 스타일시트
├── scripts/
│   ├── api.js         # API 클라이언트
│   └── main.js        # 메인 JavaScript 로직
└── README.md
```

## 🔧 실행 방법

### 방법 1: 브라우저로 직접 열기
1. `index.html` 파일을 더블클릭하거나 브라우저로 드래그

### 방법 2: Live Server 사용 (권장)
1. VS Code에서 Live Server 확장 프로그램 설치
2. `index.html` 우클릭 → "Open with Live Server"

### 방법 3: Python 간단한 서버
```bash
python -m http.server 3000
```
그 다음 브라우저에서 `http://localhost:3000` 접속

## ⚙️ 백엔드 설정

백엔드 API가 `http://127.0.0.1:8000`에서 실행되고 있어야 합니다.

다른 주소를 사용하는 경우 `scripts/api.js`의 `API_BASE_URL`을 수정하세요:

```javascript
const API_BASE_URL = 'http://your-backend-url:port/comprocessSW';
```

## 🌐 CORS 설정

백엔드에서 CORS를 허용해야 합니다. Django의 경우:

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

## 🎨 기술 스택

- **HTML5**: 구조
- **CSS3**: 스타일링 및 반응형 디자인
- **JavaScript (ES6+)**: 로직 및 API 통신
- **Fetch API**: HTTP 요청

## 📱 반응형 디자인

모바일, 태블릿, 데스크톱 모든 화면 크기에서 최적화되어 있습니다.
