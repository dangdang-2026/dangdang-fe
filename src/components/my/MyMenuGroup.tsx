import iconChevronMd from '@/assets/icons/chevron-md.svg'

export type MyMenuItem = {
  icon: string
  title: string
  description?: string
  // 없으면 아직 준비 중인 메뉴(화살표 없음)
  onClick?: () => void
}

type MyMenuGroupProps = {
  title: string
  items: MyMenuItem[]
}

// Figma M-01 메뉴 묶음(내 관리·앱 설정·도움)
function MyMenuGroup({ title, items }: MyMenuGroupProps) {
  return (
    <section className="rounded-banner bg-white pt-3.5 pr-3 pb-1.5 pl-4">
      <h2 className="text-t7 text-grey-500 font-bold">{title}</h2>
      <ul>
        {items.map(({ icon, title: itemTitle, description, onClick }) => (
          <li key={itemTitle}>
            <button
              type="button"
              disabled={!onClick}
              className="flex w-full items-center gap-3 py-3 text-left disabled:cursor-default"
              onClick={onClick}
            >
              <img src={icon} alt="" width={22} height={22} />
              <span className="flex min-w-0 flex-1 flex-col gap-px leading-snug">
                <span className="text-t6 text-grey-900 font-medium">{itemTitle}</span>
                {description && <span className="text-grey-500 text-xs">{description}</span>}
              </span>
              {onClick && <img src={iconChevronMd} alt="" width={16} height={16} />}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default MyMenuGroup
