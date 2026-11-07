import { useNavigate } from 'react-router'
import iconConstruction from '@/assets/icons/legal/construction.svg'
import { ROUTES } from '@/constants/routes'

// Figma 404 페이지. 없는 주소로 들어오면
function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col items-center justify-center bg-white px-16.5">
      <div className="flex w-full flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <img src={iconConstruction} alt="" width={40} height={40} />
          <div className="flex flex-col gap-2">
            <h1 className="text-title-2 text-grey-900">페이지를 찾을 수 없습니다</h1>
            <p className="text-body-3 text-grey-600">
              죄송합니다 더 이상 존재하지 않는 페이지입니다.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="bg-grey-900 h-11 w-full rounded-xl text-base leading-normal font-bold text-white"
          onClick={() => navigate(ROUTES.TODAY, { replace: true })}
        >
          홈으로 이동
        </button>
      </div>
    </main>
  )
}

export default NotFoundPage
