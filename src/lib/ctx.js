import { createContext, useContext } from 'react'

export const AppCtx = createContext(null) // { user, profile }
export const GroupCtx = createContext(null) // { data, reload, me, actor, memberById }

export const useApp = () => useContext(AppCtx)
export const useGroup = () => useContext(GroupCtx)
