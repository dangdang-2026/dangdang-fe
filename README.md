
# DANGDANG-Frontend

Frontend 프로젝트 협업을 위한 개발 환경 및 Git·코드 작성 규칙입니다.

---

# 🛠 Tech Stack

| Category | Stack |
| --- | --- |
| Framework | React 19 |
| Language | TypeScript 6 |
| Build Tool | Vite 8 |
| Styling | TailwindCSS v4 |
| Routing | React Router 8 |
| State Management | Zustand |
| Server State | TanStack Query |
| HTTP Client | Axios |
| Icons | Lucide React |
| Code Quality | ESLint, Prettier |
| Package Manager | npm |

---

# ⚙️ Project Setup

프로젝트의 기본 개발 환경은 다음과 같이 구성합니다.

- React + TypeScript + Vite
- TailwindCSS v4
- React Router
- TanStack Query
- Zustand
- Axios
- Lucide React
- ESLint
- Prettier
- TypeScript Strict Mode
- Path Alias (`@/`)
- 환경변수 기반 API URL 관리

## 전역 스타일

프로젝트는 TailwindCSS v4의 `@theme`을 활용하여 공통 디자인 토큰을 관리합니다.

현재 기본 테마는 노란색 계열로 구성하며, 디자인 시스템 확정 후 변경할 수 있습니다.

| Token | Value |
| --- | --- |
| Primary | `#FACC15` |
| Primary Light | `#FEF9C3` |
| Primary Dark | `#CA8A04` |
| Background | `#FFFFFF` |
| Surface | `#F9FAFB` |
| Text Primary | `#111827` |
| Text Secondary | `#6B7280` |
| Border | `#E5E7EB` |

전역 스타일은 `src/index.css`에서 관리합니다.

---

# 📁 Folder Structure

```text
src/
├── api/
│   └── axios.ts
│
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── images/
│
├── components/
│   └── common/
│
├── hooks/
│
├── layouts/
│
├── mocks/
│
├── pages/
│   └── HomePage.tsx
│
├── stores/
├── types/
├── utils/
│
├── App.tsx
├── index.css
└── main.tsx
```

## 폴더별 역할

| Directory | Description |
| --- | --- |
| `api` | Axios 인스턴스 및 API 요청 관리 |
| `assets` | 이미지, 아이콘, 폰트 등 정적 리소스 |
| `components` | 재사용 가능한 공통 컴포넌트 |
| `hooks` | 공통 커스텀 훅 |
| `layouts` | 공통 레이아웃 |
| `mocks` | 개발용 Mock 데이터 |
| `pages` | 페이지 컴포넌트 |
| `stores` | Zustand 전역 상태 관리 |
| `types` | TypeScript 타입 및 인터페이스 |
| `utils` | 공통 유틸리티 함수 |

## 폴더 관리 규칙

- 여러 페이지에서 사용하는 컴포넌트는 `components/common`에 작성합니다.
- 페이지에서만 사용하는 컴포넌트는 해당 페이지 하위에 배치할 수 있습니다.
- API 요청 관련 코드는 `api`에서 관리합니다.
- 서버 데이터는 TanStack Query를 통해 관리합니다.
- 클라이언트 전역 상태는 Zustand를 사용합니다.
- 공통으로 사용하는 타입과 함수는 `types`, `utils`에 분리합니다.
- 빈 폴더는 `.gitkeep` 파일을 사용하여 관리합니다.

---

# 🗺 Routing

페이지 라우팅은 `src/App.tsx`에서 관리합니다.

라우팅을 별도 파일로 분리하지 않고 `Routes`, `Route`를 사용합니다.

## 기본 라우팅

| Page | Route | Description |
| --- | --- | --- |
| HOME | `/` | 홈 화면 |

추가 페이지의 경로는 화면 설계 및 기능 구현 시 확정합니다.

## 라우팅 예시

```tsx
import { Routes, Route } from 'react-router'
import HomePage from '@/pages/HomePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}

export default App
```

- `BrowserRouter`는 `main.tsx`에서 설정합니다.
- 페이지가 추가되면 `App.tsx`에 경로를 등록합니다.
- 공통 레이아웃이 필요한 경우 `layouts` 폴더를 활용합니다.

---

# 🌿 Branch Convention

안정적인 개발과 기능별 작업 관리를 위해 브랜치를 역할별로 분리합니다.

- 🔵 **main**
  - 안정적인 코드를 관리하는 브랜치
  - 직접 작업하지 않습니다.
  - Pull Request를 통해 병합합니다.

- 🟣 **develop**
  - 기능 개발 결과를 통합하는 개발 브랜치
  - 새로운 작업 브랜치는 `develop`을 기준으로 생성합니다.

- 🟢 **작업 브랜치**
  - 기능 또는 이슈 단위로 생성합니다.
  - 하나의 브랜치는 하나의 이슈를 담당합니다.

```text
main
 └── develop
      ├── feat/2-login
      ├── ui/3-home-page
      ├── api/4-glucose-record
      ├── fix/5-login-error
      └── chore/1-project-setup
```

---

# 📌 Branch Naming Convention

## 구조

```text
prefix/이슈번호-작업내용
```

## 예시

```text
feat/10-login
feat/11-glucose-record
ui/12-home-page
api/13-meal-record
fix/14-login-error
refactor/15-query-hooks
docs/16-update-readme
chore/1-project-setup
```

| Prefix | 설명 |
| --- | --- |
| `feat` | 새로운 기능 추가 |
| `ui` | UI 및 페이지 구현 |
| `api` | 백엔드 API 연동 |
| `fix` | 버그 수정 |
| `hotfix` | 긴급 버그 수정 |
| `refactor` | 코드 리팩토링 |
| `docs` | 문서 수정 |
| `chore` | 설정 파일 및 환경 변경 |

## 작성 규칙

- 영문 소문자와 숫자를 사용합니다.
- 단어 구분은 하이픈 `-`을 사용합니다.
- 브랜치명에 `#`을 사용하지 않습니다.
- 하나의 브랜치는 하나의 이슈만 담당합니다.
- 작업 브랜치는 최신 `develop`에서 생성합니다.

```text
feat/10-login                 ✅
ui/12-home-page               ✅
api/13-glucose-record         ✅

feat/#10-login                ❌
feature/LoginPage             ❌
```

---

# 📝 Commit Convention

커밋 메시지는 아래 형식으로 작성합니다.

```text
이모지 Type: 작업 내용
```

## 예시

```text
🎉 Start: 프로젝트 초기 설정

✨ Feat: 혈당 기록 등록 기능 구현

🐛 Fix: 로그인 입력값 검증 오류 수정

🚑 Hotfix: 배포 환경 API 요청 오류 수정

🎨 Design: 홈 화면 레이아웃 구현

♻️ Refactor: 혈당 기록 조회 로직 분리

🔧 Settings: Axios 공통 인스턴스 설정

🗃️ Comment: API 요청 관련 주석 추가

➕ Dependency/Plugin: TanStack Query 설치

📝 Docs: README 협업 규칙 작성

🔀 Merge: 로그인 기능 브랜치 병합

🚀 Deploy: 운영 환경 배포

🚚 Rename: 페이지 컴포넌트 파일명 변경

🔥 Remove: 사용하지 않는 파일 삭제

⏪ Revert: 이전 버전으로 복구

✅ Test: 혈당 기록 관련 테스트 추가
```

| 이모지 | Type | 설명 |
| --- | --- | --- |
| 🎉 | `Start` | 프로젝트 생성 및 초기 설정 |
| ✨ | `Feat` | 새로운 기능 구현 |
| 🐛 | `Fix` | 버그 수정 |
| 🚑 | `Hotfix` | 긴급 버그 수정 |
| 🎨 | `Design` | UI 및 CSS 변경 |
| ♻️ | `Refactor` | 기능 변경 없는 코드 구조 개선 |
| 🔧 | `Settings` | 개발 환경 및 설정 파일 변경 |
| 🗃️ | `Comment` | 주석 추가 및 수정 |
| ➕ | `Dependency/Plugin` | 라이브러리 및 플러그인 추가 |
| 📝 | `Docs` | 문서 추가 및 수정 |
| 🔀 | `Merge` | 브랜치 병합 |
| 🚀 | `Deploy` | 배포 관련 작업 |
| 🚚 | `Rename` | 파일 및 폴더 이름 변경 또는 이동 |
| 🔥 | `Remove` | 파일 및 코드 삭제 |
| ⏪ | `Revert` | 이전 커밋으로 복구 |
| ✅ | `Test` | 테스트 코드 추가 및 수정 |

## 커밋 작성 규칙

- 제목 끝에 마침표를 붙이지 않습니다.
- 한 커밋에는 하나의 논리적 변경만 포함합니다.
- `수정`, `작업`, `변경`처럼 모호한 표현만 사용하지 않습니다.
- 기능 구현과 디자인 변경은 가능하면 분리합니다.
- 커밋 메시지는 한국어로 작성합니다.

```text
🐛 Fix: 오류 수정                       ❌
🐛 Fix: 로그인 입력값 검증 오류 수정    ✅
```

---

# 🔀 Workflow

1. 작업할 GitHub Issue를 생성합니다.
2. `develop` 브랜치를 최신화합니다.
3. `develop`에서 작업 브랜치를 생성합니다.
4. 기능 개발 후 Commit Convention에 맞게 커밋합니다.
5. 원격 저장소에 Push합니다.
6. `develop` 브랜치로 Pull Request를 생성합니다.
7. 팀원들의 코드 리뷰를 진행합니다.
8. 승인 후 병합합니다.
9. Merge가 완료되면 작업 브랜치를 삭제합니다.
10. 배포 시 `develop` 브랜치를 `main`으로 병합합니다.

## Merge 규칙

- `main`, `develop` 브랜치에 직접 Push하지 않습니다.
- Pull Request를 통해서만 병합합니다.
- 최소 1명의 리뷰 승인을 받습니다.
- 충돌은 Pull Request 작성자가 해결합니다.
- Merge 후 작업 브랜치를 삭제합니다.
- 병합 방식은 `Squash and merge`를 권장합니다.

---

# 🎨 CSS Convention

프로젝트는 **TailwindCSS v4**를 사용합니다.

## 기본 규칙

- Tailwind Utility Class 사용을 우선합니다.
- 인라인 스타일(`style={{ }}`)은 필요한 경우를 제외하고 사용하지 않습니다.
- 반복되는 UI는 공통 컴포넌트로 분리합니다.
- 반응형은 **Mobile First** 방식으로 작성합니다.
- Tailwind 클래스 오타와 중복을 확인합니다.
- 디자인 토큰을 우선 사용합니다.
- 임의값은 디자인 요구사항이 명확한 경우에만 사용합니다.
- 컴포넌트 간 간격은 `gap`, `padding`, `margin` 등을 일관되게 사용합니다.

## 디자인 토큰

공통 색상은 `src/index.css`의 `@theme`에서 관리합니다.

```css
@import "tailwindcss";

@theme {
  --color-primary: #facc15;
  --color-primary-light: #fef9c3;
  --color-primary-dark: #ca8a04;

  --color-background: #ffffff;
  --color-surface: #f9fafb;

  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
}
```

사용 예시:

```tsx
<div className="bg-primary-light text-text-primary">
  <button className="bg-primary text-text-primary">
    확인
  </button>
</div>
```

## 반응형 레이아웃

- 모바일 화면을 우선으로 설계합니다.
- 화면 너비에 따라 Tailwind 반응형 클래스를 사용합니다.
- 페이지 공통 레이아웃이 필요한 경우 `layouts`에서 관리합니다.
- 화면의 최대 너비 및 브레이크포인트는 디자인 확정 후 적용합니다.

---

# 🔗 API Convention

HTTP 통신에는 **Axios**를 사용하고, 서버 상태 관리에는 **TanStack Query**를 사용합니다.

## Axios Instance

공통 Axios 인스턴스는 `src/api/axios.ts`에서 관리합니다.

```ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})
```

## API 요청 규칙

- Axios 공통 인스턴스를 사용합니다.
- API 주소는 환경변수로 관리합니다.
- API 요청 로직과 UI 컴포넌트를 가능한 한 분리합니다.
- 서버 데이터는 TanStack Query를 사용하여 관리합니다.
- 클라이언트 전역 상태는 Zustand를 사용합니다.
- 공통 에러 처리 및 인증 인터셉터는 인증 방식 확정 후 추가합니다.

## TanStack Query

`main.tsx`에서 `QueryClientProvider`를 설정합니다.

현재 기본 옵션:

| Option | Value |
| --- | --- |
| `staleTime` | 1분 |
| `retry` | 1회 |
| `refetchOnWindowFocus` | false |

기능별 데이터 특성에 따라 Query 옵션을 개별 설정할 수 있습니다.

## Environment Variables

프로젝트 루트에 `.env` 파일을 생성하여 API 서버 주소를 설정합니다.

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

- 개발 환경에 맞는 API 주소를 사용합니다.
- `.env.example`을 참고하여 설정합니다.
- `.env` 파일은 Git에 업로드하지 않습니다.
- `VITE_` 환경변수에 비밀키를 저장하지 않습니다.

---

# 💻 Getting Started

## Requirements

- Node.js 20.19+ 또는 22.12+ 이상의 호환 버전
- npm
- Git

설치된 버전을 확인합니다.

```bash
node -v
npm -v
git --version
```

## Repository Clone

```bash
git clone https://github.com/dangdang-2026/dangdang-fe.git
cd dangdang-fe
```

## Branch Checkout

```bash
git switch develop
```

## Package Install

```bash
npm ci
```

`package-lock.json`이 없는 경우 `npm install`을 사용합니다.

## Environment Setup

프로젝트 루트에 `.env` 파일을 생성합니다.

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Development Server

```bash
npm run dev
```

기본 접속 주소:

```text
http://localhost:5173
```

## Production Build

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉터리에 생성됩니다.

## Preview

```bash
npm run preview
```

---

# 🧹 Code Check

Pull Request를 생성하기 전에 아래 명령어를 실행합니다.

## Prettier 검사

```bash
npm run format:check
```

## ESLint 검사

```bash
npm run lint
```

## Build 검사

```bash
npm run build
```

필요한 경우 Prettier 자동 포맷을 실행합니다.

```bash
npm run format
```

검사를 모두 통과한 후 Pull Request를 생성합니다.

---

# 🔗 Repository

| Repository | Link |
| --- | --- |
| Frontend | [dangdang-fe](https://github.com/dangdang-2026/dangdang-fe) |
| Backend | [dangdang-be](https://github.com/dangdang-2026/dangdang-be) |
