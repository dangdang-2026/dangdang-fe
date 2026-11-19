import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getErrorCode } from '@/api/axios'
import { getFood } from '@/api/foods'
import { createMyFood, deleteMyFood, getMyFoods, toMyFood, updateMyFood } from '@/api/myFoods'
import type { Food, MyFood } from '@/types/glucose'

type FoodState = {
  myFoods: MyFood[]
  addMyFood: (food: MyFood) => void
  // 이름이 바뀌어도 원래 자리 유지
  updateMyFood: (name: string, food: MyFood) => void
  removeMyFood: (name: string) => void
  // 기기에서 지우고 서버에서 아직 못 지운 내 음식 id
  removedIds: number[]
  // 검색에서 고른 서버 음식. 끼니엔 이름만 남아서 이름으로 영양값·주식 여부를 다시 찾음
  pickedFoods: Food[]
  rememberFood: (food: Food) => void
}

// 같은 이름 내 음식의 서버 id는 이어받고, 이름이 겹쳐 밀려난 내 음식은 서버에서도 지움
const takeOver = (state: FoodState, food: MyFood, replaced: MyFood[]) => {
  const own = replaced.find((item) => item.name === food.name)?.serverId
  return {
    food: { ...food, serverId: food.serverId ?? own, pending: true },
    removedIds: [
      ...state.removedIds,
      ...replaced.flatMap((item) =>
        item.serverId !== undefined && item.serverId !== (food.serverId ?? own)
          ? [item.serverId]
          : [],
      ),
    ],
  }
}

// 내 음식은 기기에 먼저 적고 서버에 보냄. 못 보내면 pending으로 남겨 동기화 때 다시
export const useFoodStore = create<FoodState>()(
  persist(
    (set) => ({
      myFoods: [],
      addMyFood: (food) => {
        set((state) => {
          const replaced = state.myFoods.filter((item) => item.name === food.name)
          const next = takeOver(state, food, replaced)
          return {
            myFoods: [...state.myFoods.filter((item) => item.name !== food.name), next.food],
            removedIds: next.removedIds,
          }
        })
        void pushMyFoods()
      },
      updateMyFood: (name, food) => {
        set((state) => {
          const original = state.myFoods.find((item) => item.name === name)
          const replaced = state.myFoods.filter(
            (item) => item.name !== name && item.name === food.name,
          )
          const next = takeOver(state, { ...food, serverId: original?.serverId }, replaced)
          return {
            myFoods: state.myFoods
              .filter((item) => item.name === name || item.name !== food.name)
              .map((item) => (item.name === name ? next.food : item)),
            removedIds: next.removedIds,
          }
        })
        void pushMyFoods()
      },
      removeMyFood: (name) => {
        set((state) => {
          const target = state.myFoods.find((item) => item.name === name)
          return {
            myFoods: state.myFoods.filter((item) => item.name !== name),
            removedIds:
              target?.serverId !== undefined
                ? [...state.removedIds, target.serverId]
                : state.removedIds,
          }
        })
        void pushMyFoods()
      },
      removedIds: [],
      pickedFoods: [],
      rememberFood: (food) =>
        set((state) => ({
          pickedFoods: [...state.pickedFoods.filter((item) => item.name !== food.name), food],
        })),
    }),
    { name: 'dangdang-foods' },
  ),
)

const getKnownFoods = () => {
  const { myFoods, pickedFoods } = useFoodStore.getState()
  return [...myFoods, ...pickedFoods]
}

// 서버에 아직 없는 내 음식(항목 API 전에 기기에만 적은 것 포함)
const needsPush = (food: MyFood) => food.pending || food.serverId === undefined

// 한 번에 하나만 보내서 같은 음식이 두 번 생기지 않게
let pushing: Promise<void> = Promise.resolve()

async function pushOnce() {
  for (const id of useFoodStore.getState().removedIds) {
    try {
      await deleteMyFood(id)
    } catch (error) {
      // 이미 없는 음식이면 지운 걸로 봄
      if (getErrorCode(error) !== 'MYFOOD_40401') continue
    }
    useFoodStore.setState((state) => ({
      removedIds: state.removedIds.filter((item) => item !== id),
    }))
  }

  for (const food of useFoodStore.getState().myFoods.filter(needsPush)) {
    try {
      let id = food.serverId
      if (id === undefined) {
        try {
          id = (await createMyFood(food, getKnownFoods())).id
        } catch (error) {
          // 서버에 같은 이름이 있으면 그 음식을 고침
          if (getErrorCode(error) !== 'MYFOOD_40901') throw error
          id = (await getMyFoods()).find((item) => item.name === food.name)?.id
          if (id === undefined) throw error
          await updateMyFood(id, food, getKnownFoods())
        }
      } else {
        await updateMyFood(id, food, getKnownFoods())
      }
      // 보내는 사이 또 고쳤으면 id만 남기고 다음에 다시 보냄
      useFoodStore.setState((state) => ({
        myFoods: state.myFoods.map((item) =>
          item === food
            ? { ...item, serverId: id, pending: undefined }
            : item.name === food.name
              ? { ...item, serverId: id }
              : item,
        ),
      }))
    } catch {
      // 다음 동기화 때 다시
    }
  }
}

// 기기에서 바꾼 내 음식을 서버에 보냄
export function pushMyFoods() {
  pushing = pushing.then(pushOnce)
  return pushing
}

// 못 보낸 걸 먼저 보내고 서버 목록으로 맞춤. 그래도 못 보낸 건 기기 값 유지
// 새로 로그인하면 기기에 남은 건 다른 계정 것일 수 있어 보내지 않고 버림
export async function syncMyFoods(keepLocal = true) {
  if (keepLocal) await pushMyFoods()
  else useFoodStore.setState({ myFoods: [], removedIds: [] })
  const server = await getMyFoods()
  // 비슷한 음식 이름을 몰라서 처음 보는 식품코드는 받아 둠
  const known = new Set(getKnownFoods().flatMap((food) => (food.code ? [food.code] : [])))
  const codes = [
    ...new Set(server.flatMap((item) => (item.similarFoodCode ? [item.similarFoodCode] : []))),
  ].filter((code) => !known.has(code))
  const fetched = await Promise.allSettled(codes.map(getFood))
  fetched.forEach((result) => {
    if (result.status === 'fulfilled') useFoodStore.getState().rememberFood(result.value.food)
  })

  useFoodStore.setState((state) => {
    const local = state.myFoods.filter(needsPush)
    const names = new Set(local.map((food) => food.name))
    const removed = new Set(state.removedIds)
    const synced = server
      .filter((item) => !removed.has(item.id) && !names.has(item.name))
      .map((item) => toMyFood(item, [...state.myFoods, ...state.pickedFoods]))
    return { myFoods: [...synced.reverse(), ...local] }
  })
}
