import { create } from 'zustand'
import type { Profile } from '@/types'

interface UserState {
  profile: Profile | null
  setProfile: (profile: Profile | null) => void
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}))
