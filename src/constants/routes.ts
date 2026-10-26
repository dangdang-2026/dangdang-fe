export const ROUTES = {
  TODAY: '/',
  RECORDS: '/records',
  VISIT: '/visit',
  VISIT_REPORT: '/visit/report',
  VISIT_REPORTS: '/visit/reports',
  VISIT_CRITERIA: '/visit/criteria',
  VISIT_CRITERIA_HISTORY: '/visit/criteria/history',
  COMMUNITY: '/community',
  COMMUNITY_BOARD: '/community/board/:board',
  COMMUNITY_POST: '/community/posts/:id',
  COMMUNITY_WRITE: '/community/write',
  MY: '/my',
  MY_PROFILE: '/my/profile',
  MY_CRITERIA: '/my/criteria',
  MY_NOTIFICATIONS: '/my/notifications',
  MY_FOODS: '/my/foods',
  MY_TERMS: '/my/terms',
} as const

export const communityBoardPath = (board: string) => `/community/board/${board}`
export const communityPostPath = (id: string) => `/community/posts/${id}`
