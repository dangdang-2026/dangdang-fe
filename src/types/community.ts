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
}
