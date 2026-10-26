// 게시판: 식단 · 측정·알림 · 진료 후기 · 마음 · 출산·산후 · 자유 · 질문
export type BoardKey = 'diet' | 'measure' | 'visit' | 'mind' | 'birth' | 'free' | 'question'

export type PostSort = 'latest' | 'popular'

// 글쓴이. 닉네임과 그때 임신 주수만 보여 줌
export type Author = {
  id: string
  nickname: string
  // 모르면 null
  pregnancyWeek: number | null
}

export type CommunityComment = {
  id: string
  author: Author
  body: string
  createdAt: string
  likes: number
  // 답글이면 원 댓글 id. 답글의 답글은 없음
  parentId?: string
  // 운영정책으로 가려진 댓글
  hidden?: boolean
}

export type PollOption = {
  id: string
  label: string
  votes: number
}

export type Post = {
  id: string
  board: BoardKey
  title: string
  body: string
  author: Author
  createdAt: string
  editedAt?: string
  views: number
  likes: number
  comments: CommunityComment[]
  // 운영정책으로 가려진 글
  hidden?: boolean
  // 투표. 올린 뒤에는 고칠 수 없음
  poll?: PollOption[]
}

// 글쓰기 임시 저장. 게시판을 안 골랐으면 null
export type PostDraft = {
  board: BoardKey | null
  title: string
  body: string
  anonymous: boolean
  // 투표 항목. 투표를 안 넣으면 null
  poll: string[] | null
}

export type ReportReason = 'medical' | 'compare' | 'ad' | 'privacy' | 'abuse' | 'etc'
