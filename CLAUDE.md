# dangdang-fe

React 19 + TypeScript + Vite + Tailwind CSS v4. 화면 기준은 Figma(SW인재양성) 와이어프레임.

## Tailwind CSS 스타일 규칙

- spacing은 Tailwind v4 기본 단위(4px = 1)로 통일. `px-[34px]`처럼 px을 직접 쓰는 arbitrary value 금지
  - `pt-[34px]` → `pt-8.5`, `gap-[13px]` → `gap-3`, `p-[15px]` → `p-4`, `mt-[7px]` → `mt-2`, `w-[25px]` → `w-6`
- 소수점은 0.5 단위까지만. 더 세밀한 값은 가장 가까운 0.5 단위로 반올림
- 너비·높이·padding·margin·gap·inset·translate·border-radius 등 모두 기본 유틸리티 우선
- 글자 크기는 `text-xs`, `text-sm`, `text-base`, `text-lg` 등 기본 유틸리티 우선, `text-[14px]` 같은 arbitrary value 금지
  - 기본 스케일에 없는 Figma 타이포(예: 11px caption)는 `src/index.css`의 `@theme` 토큰(`text-caption` 등)으로 정의해서 사용
- 색상은 `@theme`의 브랜드 컬러·디자인 토큰 사용 (`primary`, `yellow-*`, `orange-400`, `grey-*`)
- 그림자처럼 기본 유틸리티로 표현 안 되는 디자인 값은 `@theme` 토큰으로 추가 (`--shadow-*`, `--drop-shadow-*`)
- `env(safe-area-inset-*)`처럼 arbitrary value가 꼭 필요하면 px 대신 `--spacing(n)` 사용
  - 예: `pb-[max(--spacing(5),env(safe-area-inset-bottom))]`
- 숫자만 치환하지 말고 Tailwind v4에서 실제 생성되는 유틸리티인지 빌드 결과로 확인
- 스타일 정리 시 컴포넌트 구조·기능·애니메이션·라우팅은 건드리지 않고, 변경 전후 디자인 차이 최소화

## 코드 주석

- 음슴체로 한 줄, 간결하게. 핵심 수치·이유만
  - 예: `// 탭 바(84px) + 활성 원 돌출(32px)만큼 하단 여백 확보`
- "~한다" 서술체, 긴 설명 문장, JSDoc 블록 쓰지 않기

## Git

- 커밋·push는 요청할 때만
- 커밋 메시지는 README의 Commit Convention(`이모지 Type: 작업 내용`, 한국어) 준수
  - 예: `✨ Feat: 혈당 기록 등록 기능 구현`, `📝 Docs: README 협업 규칙 작성`
- Co-Authored-By 등 Claude 관련 메타데이터 추가하지 않기
