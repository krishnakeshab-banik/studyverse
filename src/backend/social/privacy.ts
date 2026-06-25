import type { UserPublicProfile } from "./types"

export function canViewProfileContent(
  profile: UserPublicProfile,
  viewerUid?: string | null,
): boolean {
  if (!profile.isPrivate) return true
  if (!viewerUid) return false
  if (viewerUid === profile.uid) return true
  return profile.followers.includes(viewerUid)
}
