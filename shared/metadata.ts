import { sources } from "./sources"
import { typeSafeObjectEntries, typeSafeObjectFromEntries } from "./type.util"
import type { Metadata } from "./types"

export const columnIds = ["focus", "realtime", "hottest", "china", "world", "tech", "finance"] as const

const originMetadata: Metadata = {
  china: {
    name: "国内",
    sources: ["zhihu", "thepaper"],
  },
  world: {
    name: "国际",
    sources: ["zaobao", "cankaoxiaoxi"],
  },
  tech: {
    name: "科技",
    sources: ["ithome", "v2ex", "coolapk"],
  },
  finance: {
    name: "财经",
    sources: ["cls-telegraph", "cls-depth", "wallstreetcn", "wallstreetcn-hot", "wallstreetcn-news", "xueqiu-hotstock", "gelonghui"],
  },
  focus: {
    name: "关注",
    sources: [],
  },
  realtime: {
    name: "实时",
    sources: [],
  },
  hottest: {
    name: "最热",
    sources: [],
  },
}

export const metadata = typeSafeObjectFromEntries(typeSafeObjectEntries(originMetadata).map(([k, v]) => {
  switch (k) {
    case "focus":
      return [k, v]
    case "hottest":
      return [k, {
        ...v,
        sources: typeSafeObjectEntries(sources).filter(([, v]) => v.type === "hottest" && !v.redirect).map(([k]) => k),
      }]
    case "realtime":
      return [k, {
        ...v,
        sources: ["weibo", ...typeSafeObjectEntries(sources).filter(([, v]) => v.type === "realtime" && !v.redirect).map(([k]) => k)],
      }]
    default:
      return [k, {
        ...v,
        sources: v.sources.filter(s => sources[s]),
      }]
  }
}))
