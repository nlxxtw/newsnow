import type { NewsItem, SourceID, SourceResponse } from "@shared/types"
import type { UseQueryResult } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"
import clsx from "clsx"
import { useInView } from "framer-motion"
import { useAtom } from "jotai"
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from "react"
import { sources } from "@shared/sources"
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities"
import { ofetch } from "ofetch"
import { useWindowSize } from "react-use"
import { OverlayScrollbar } from "../common/overlay-scrollbar"
import { focusSourcesAtom, refetchSourcesAtom } from "~/atoms"
import { useRelativeTime } from "~/hooks/useRelativeTime"
import { safeParseString } from "~/utils"

export interface ItemsProps extends React.HTMLAttributes<HTMLDivElement> {
  id: SourceID
  /**
   * 是否显示透明度，拖动时原卡片的样式
   */
  isDragged?: boolean
  handleListeners?: SyntheticListenerMap
}

interface NewsCardProps {
  id: SourceID
  inView: boolean
  handleListeners?: SyntheticListenerMap
}

interface Query {
  query: UseQueryResult<SourceResponse, Error>
}

export const CardWrapper = forwardRef<HTMLDivElement, ItemsProps>(({ id, isDragged, handleListeners, style, ...props }, dndRef) => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)

  useImperativeHandle(dndRef, () => ref.current!)

  return (
    <div
      ref={ref}
      className={clsx(
        "flex flex-col h-500px rounded-2xl p-4 cursor-default",
        "bg-op-40 backdrop-blur-5 transition-opacity-300",
        isDragged && "op-50",
        `bg-${sources[id].color}`,
      )}
      style={{
        transformOrigin: "50% 50%",
        ...style,
      }}
      {...props}
    >
      <NewsCard id={id} inView={inView} handleListeners={handleListeners} />
    </div>
  )
})

function NewsCard({ id, inView, handleListeners }: NewsCardProps) {
  const [focusSources, setFocusSources] = useAtom(focusSourcesAtom)
  const [refetchSource, setRefetchSource] = useAtom(refetchSourcesAtom)
  const query = useQuery({
    queryKey: [id, refetchSource[id]],
    queryFn: async ({ queryKey }) => {
      const [_id, _refetchTime] = queryKey as [SourceID, number]
      let url = `/api/s/${_id}`
      if (Date.now() - _refetchTime < 1000) {
        url = `/api/s/${_id}?latest`
      }
      const response: SourceResponse = await ofetch(url, {
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${safeParseString(localStorage.getItem("jwt"))}`,
        },
      })
      return response
    },
    // refetch 时显示原有的数据
    placeholderData: prev => prev,
    staleTime: 1000 * 60 * 5,
    enabled: inView,
  })

  const addFocusList = useCallback(() => {
    setFocusSources(focusSources.includes(id) ? focusSources.filter(i => i !== id) : [...focusSources, id])
  }, [setFocusSources, focusSources, id])
  const manualRefetch = useCallback(() => {
    setRefetchSource(prev => ({
      ...prev,
      [id]: Date.now(),
    }))
  }, [setRefetchSource, id])

  const isFreshFetching = useMemo(() => query.isFetching && !query.isPlaceholderData, [query])

  return (
    <>
      <div className={clsx("flex justify-between mx-2 mt-0 mb-2 items-center")}>
        <div className="flex gap-2 items-center">
          <span
            className={clsx("w-8 h-8 rounded-full bg-cover")}
            style={{
              backgroundImage: `url(/icons/${id.split("-")[0]}.png)`,
            }}
          />
          <span className="flex flex-col">
            <span className="flex items-center gap-2">
              <span className="text-xl font-bold">
                {sources[id].name}
              </span>
              {sources[id]?.title && <span className={clsx("text-sm", `color-${sources[id].color} bg-base op-80 bg-op-50! px-1 rounded`)}>{sources[id].title}</span>}
            </span>
            <span className="text-xs op-70"><UpdatedTime query={query} /></span>
          </span>
        </div>
        <div className={clsx("flex gap-2 text-lg", `color-${sources[id].color}`)}>
          <button
            type="button"
            className={clsx("btn i-ph:arrow-counter-clockwise-duotone", query.isFetching && "animate-spin i-ph:circle-dashed-duotone")}
            onClick={manualRefetch}
          />
          <button
            type="button"
            className={clsx("btn", focusSources.includes(id) ? "i-ph:star-fill" : "i-ph:star-duotone")}
            onClick={addFocusList}
          />
          <button
            {...handleListeners}
            type="button"
            className={clsx("btn", "i-ph:dots-six-vertical-duotone", "cursor-grab")}
          />
        </div>
      </div>

      <OverlayScrollbar
        className={clsx([
          "h-full p-2 overflow-x-auto rounded-2xl bg-base bg-op-70!",
          isFreshFetching && `animate-pulse`,
          `sprinkle-${sources[id].color}`,
        ])}
        options={{
          overflow: { x: "hidden" },
        }}
        defer
      >
        <div className={clsx("transition-opacity-500", isFreshFetching && "op-20")}>
          {sources[id].type === "hottest" ? <NewsListHot query={query} /> : <NewsListTimeLine query={query} />}
        </div>
      </OverlayScrollbar>
    </>
  )
}

function UpdatedTime({ query }: Query) {
  const updatedTime = useRelativeTime(query.data?.updatedTime ?? "")
  if (updatedTime) return `${updatedTime}更新`
  if (query.isError) return "获取失败"
  return "加载中..."
}

function ExtraInfo({ item }: { item: NewsItem }) {
  if (item?.extra?.info) {
    return <>{item.extra.info}</>
  }
  if (item?.extra?.icon) {
    return <img src={item.extra.icon} className="w-5 inline" onError={e => e.currentTarget.hidden = true} />
  }
}

function NewsUpdatedTime({ date }: { date: string }) {
  const relativeTime = useRelativeTime(date)
  return <>{relativeTime}</>
}
function NewsListHot({ query }: Query) {
  const items = query.data?.items
  const { width } = useWindowSize()
  return (
    <>
      {items?.map((item, i) => (
        <a
          href={width < 768 ? item.mobileUrl || item.url : item.url}
          target="_blank"
          key={item.id}
          className={clsx(
            "flex gap-2 items-center mb-2 items-stretch",
            "hover:bg-neutral-400/10 rounded-md pr-1 visited:(text-neutral-400)",
          )}
        >
          <span className={clsx("bg-neutral-400/10 min-w-6 flex justify-center items-center rounded-md text-sm")}>
            {i + 1}
          </span>
          <span className="self-start line-height-none">
            <span className="mr-2 text-base">
              {item.title}
            </span>
            <span className="text-xs text-neutral-400/80 truncate align-middle">
              <ExtraInfo item={item} />
            </span>
          </span>
        </a>
      ))}
    </>
  )
}

function NewsListTimeLine({ query }: Query) {
  const items = query.data?.items
  const { width } = useWindowSize()
  return (
    <ol className="border-s border-neutral-400/50 flex flex-col ml-1">
      {items?.map(item => (
        <li key={item.id} className="flex flex-col">
          <span className="flex items-center gap-1 text-neutral-400/50 ml--1px">
            <span className="">-</span>
            <span className="text-xs text-neutral-400/80">
              {item?.extra?.date && <NewsUpdatedTime date={item.extra.date} />}
            </span>
            <span className="text-xs text-neutral-400/80">
              <ExtraInfo item={item} />
            </span>
          </span>
          <a
            className={clsx("ml-2 px-1 hover:bg-neutral-400/10 rounded-md visited:(text-neutral-400/80)")}
            href={width < 768 ? item.mobileUrl || item.url : item.url}
            target="_blank"
          >
            {item.title}
          </a>
        </li>
      ))}
    </ol>
  )
}
