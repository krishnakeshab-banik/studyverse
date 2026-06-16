"use client"

import { PageShell } from "@/components/ui/page-shell"
import { PublicProfileView } from "@/components/social/public-profile-view"
import { User } from "lucide-react"
import { use } from "react"

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <PageShell
      title="Profile"
      subtitle="View creator profile"
      icon={User}
      iconAccent="#6366f1"
      noPadding
      contentClassName="p-4 sm:p-6"
    >
      <PublicProfileView studyverseId={id} />
    </PageShell>
  )
}
