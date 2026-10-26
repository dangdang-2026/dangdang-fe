import iconCatBirth from '@/assets/icons/community/cat-birth.svg'
import iconCatDiet from '@/assets/icons/community/cat-diet.svg'
import iconCatMeasure from '@/assets/icons/community/cat-measure.svg'
import iconCatMind from '@/assets/icons/community/cat-mind.svg'
import iconCatVisit from '@/assets/icons/community/cat-visit.svg'
import type { BoardKey } from '@/types/community'

export const BOARD_ORDER: BoardKey[] = [
  'diet',
  'measure',
  'visit',
  'mind',
  'birth',
  'free',
  'question',
]

export const BOARD_LABEL: Record<BoardKey, string> = {
  diet: '식단',
  measure: '측정·알림',
  visit: '진료 후기',
  mind: '마음',
  birth: '출산·산후',
  free: '자유',
  question: '질문',
}

// 메인 카테고리 줄 아이콘. 없는 게시판은 탭·펼침에서만 보임
export const BOARD_ICON: Partial<Record<BoardKey, string>> = {
  diet: iconCatDiet,
  measure: iconCatMeasure,
  visit: iconCatVisit,
  mind: iconCatMind,
  birth: iconCatBirth,
}

// 식단 게시판은 사진·메뉴 비교로 번지지 않게 최신순만
export const LATEST_ONLY_BOARDS: BoardKey[] = ['diet']

// 조회수가 이만큼 넘으면 인기 칩
export const POPULAR_VIEWS = 1000

export const MY_AUTHOR_ID = 'me'
