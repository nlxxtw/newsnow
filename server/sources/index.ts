import type { DisabledSourceID, SourceID } from "@shared/types"
import weibo from "./weibo"
import zaobao from "./zaobao"
import v2ex from "./v2ex"
import ithome from "./ithome"
import zhihu from "./zhihu"
import cankaoxiaoxi from "./cankaoxiaoxi"
import coolapk from "./coolapk"
import kr36 from "./36kr"
import wallstreetcn from "./wallstreetcn"
import douyin from "./douyin"
import toutiao from "./toutiao"
import cls from "./cls"
import sputniknewscn from "./sputniknewscn"
import xueqiu from "./xueqiu"
import gelonghui from "./gelonghui"
import tieba from "./tieba"
import thepaper from "./thepaper"
import type { SourceGetter } from "#/types"

export const sourcesGetters = {
  weibo,
  zaobao,
  ...v2ex,
  ithome,
  zhihu,
  coolapk,
  cankaoxiaoxi,
  thepaper,
  sputniknewscn,
  ...wallstreetcn,
  ...xueqiu,
  gelonghui,
  douyin,
  ...cls,
  toutiao,
  tieba,
  ...kr36,
} as Record<SourceID, SourceGetter> & Partial<Record<DisabledSourceID, SourceGetter>>
