import AsyncStorage from "@react-native-async-storage/async-storage"
import { Directory, File, Paths } from "expo-file-system"

export interface QueuedScan {
  id: string
  photoPath: string
  capturedAt: string
  lat: number
  lng: number
}

const STORAGE_KEY = "offlineScanQueue"
const QUEUE_DIR_NAME = "offline-scans"

function queueDir(): Directory {
  return new Directory(Paths.document, QUEUE_DIR_NAME)
}

async function readQueue(): Promise<QueuedScan[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as QueuedScan[]) : []
}

async function writeQueue(queue: QueuedScan[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

// The camera writes to a cache location that isn't guaranteed to survive an
// app restart, so a queued scan's photo is copied into document storage,
// which is.
async function persistPhoto(sourceUri: string, id: string): Promise<string> {
  const dir = queueDir()
  if (!dir.exists) dir.create({ intermediates: true })
  const source = new File(sourceUri)
  const dest = new File(dir, `${id}.jpg`)
  source.copy(dest)
  return dest.uri
}

async function enqueue(input: { photoUri: string; capturedAt: string; lat: number; lng: number }): Promise<QueuedScan> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const photoPath = await persistPhoto(input.photoUri, id)
  const entry: QueuedScan = { id, photoPath, capturedAt: input.capturedAt, lat: input.lat, lng: input.lng }
  const queue = await readQueue()
  queue.push(entry)
  await writeQueue(queue)
  return entry
}

async function remove(id: string): Promise<void> {
  const queue = await readQueue()
  const entry = queue.find((q) => q.id === id)
  if (entry) {
    const file = new File(entry.photoPath)
    if (file.exists) file.delete()
  }
  await writeQueue(queue.filter((q) => q.id !== id))
}

async function getAll(): Promise<QueuedScan[]> {
  return readQueue()
}

async function count(): Promise<number> {
  return (await readQueue()).length
}

export const offlineScanQueue = { enqueue, remove, getAll, count }
