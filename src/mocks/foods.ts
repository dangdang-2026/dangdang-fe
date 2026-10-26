import type { Food } from '@/types/glucose'

// 식약처 식품 DB 연동 전 임시 음식 목록
export const MOCK_FOODS: Food[] = [
  { name: '현미밥', unit: '공기' },
  { name: '잡곡밥', unit: '공기' },
  { name: '흰쌀밥', unit: '공기' },
  { name: '김치볶음밥', unit: '공기' },
  { name: '볶음밥', unit: '공기' },
  { name: '오므라이스', unit: '접시' },
  { name: '비빔밥', unit: '그릇' },
  { name: '김밥', unit: '줄' },
  { name: '계란말이', unit: '접시' },
  { name: '계란후라이', unit: '개' },
  { name: '된장국', unit: '그릇' },
  { name: '미역국', unit: '그릇' },
  { name: '김치찌개', unit: '그릇' },
  { name: '된장찌개', unit: '그릇' },
  { name: '순두부찌개', unit: '그릇' },
  { name: '두부부침', unit: '접시' },
  { name: '두부조림', unit: '접시' },
  { name: '함박스테이크', unit: '인분' },
  { name: '불고기', unit: '인분' },
  { name: '제육볶음', unit: '인분' },
  { name: '닭가슴살 샐러드', unit: '그릇' },
  { name: '고등어구이', unit: '토막' },
  { name: '시금치나물', unit: '접시' },
  { name: '콩나물무침', unit: '접시' },
  { name: '배추김치', unit: '접시' },
  { name: '잔치국수', unit: '그릇' },
  { name: '칼국수', unit: '그릇' },
  { name: '떡볶이', unit: '인분' },
  { name: '샌드위치', unit: '개' },
  { name: '고구마', unit: '개' },
  { name: '바나나', unit: '개' },
  { name: '사과', unit: '개' },
  { name: '플레인 요거트', unit: '컵' },
  { name: '우유', unit: '컵' },
]

// 최근 먹은 음식이 없을 때 보여 줄 기본 음식
export const DEFAULT_RECENT_FOODS = ['현미밥', '계란말이', '된장국']
