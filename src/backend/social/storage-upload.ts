import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { getClientStorage } from "@/backend/db/firebase"

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const ref = storageRef(getClientStorage(), `avatars/${uid}/${Date.now()}-${file.name}`)
  await uploadBytes(ref, file)
  return getDownloadURL(ref)
}

export async function uploadPostImages(uid: string, files: File[]): Promise<string[]> {
  const urls: string[] = []
  for (const file of files.slice(0, 4)) {
    const ref = storageRef(getClientStorage(), `posts/${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${file.name}`)
    await uploadBytes(ref, file)
    urls.push(await getDownloadURL(ref))
  }
  return urls
}
