import { supabase } from './supabase'
import {
  getAllData,
  getDailyMeasurement,
  getWeeklyMeasurement,
  saveDailyMeasurement,
  saveWeeklyMeasurement,
} from './dataService'

const SYNC_KEY = 'last_cloud_sync'
const DEVICE_KEY = 'device_id'
const SYNC_INTERVAL = 24 * 60 * 60 * 1000 // 24h

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

/** Push local data to Supabase — only if local is newer than remote */
async function pushToCloud(deviceId: string): Promise<void> {
  const { dailyMeasurements, weeklyMeasurements } = await getAllData()

  for (const m of dailyMeasurements) {
    const { data: remote } = await supabase
      .from('daily_measurements')
      .select('updated_at')
      .eq('device_id', deviceId)
      .eq('date', m.date)
      .maybeSingle()

    if (remote && remote.updated_at >= m.updatedAt) continue

    await supabase.from('daily_measurements').upsert({
      device_id: deviceId,
      date: m.date,
      weight: m.weight ?? null,
      body_fat: m.bodyFat ?? null,
      source: m.source,
      updated_at: m.updatedAt,
    }, { onConflict: 'device_id,date' })
  }

  for (const m of weeklyMeasurements) {
    const { data: remote } = await supabase
      .from('weekly_measurements')
      .select('updated_at')
      .eq('device_id', deviceId)
      .eq('date', m.date)
      .maybeSingle()

    if (remote && remote.updated_at >= m.updatedAt) continue

    await supabase.from('weekly_measurements').upsert({
      device_id: deviceId,
      date: m.date,
      chest: m.chest ?? null,
      waist: m.waist ?? null,
      hip: m.hip ?? null,
      belly: m.belly ?? null,
      upper_arm: m.upperArm ?? null,
      thigh: m.thigh ?? null,
      updated_at: m.updatedAt,
    }, { onConflict: 'device_id,date' })
  }
}

/** Pull remote data — only overwrite local if remote is newer */
async function pullFromCloud(deviceId: string): Promise<void> {
  const { data: dailyRows } = await supabase
    .from('daily_measurements')
    .select('*')
    .eq('device_id', deviceId)

  if (dailyRows) {
    for (const row of dailyRows) {
      const local = await getDailyMeasurement(row.date)
      if (local && local.updatedAt >= row.updated_at) continue

      try {
        await saveDailyMeasurement({
          date: row.date,
          weight: row.weight ?? undefined,
          bodyFat: row.body_fat ?? undefined,
          source: row.source as 'manual' | 'fitbit',
          updatedAt: row.updated_at,
        })
      } catch { /* skip invalid */ }
    }
  }

  const { data: weeklyRows } = await supabase
    .from('weekly_measurements')
    .select('*')
    .eq('device_id', deviceId)

  if (weeklyRows) {
    for (const row of weeklyRows) {
      const local = await getWeeklyMeasurement(row.date)
      if (local && local.updatedAt >= row.updated_at) continue

      try {
        await saveWeeklyMeasurement({
          date: row.date,
          chest: row.chest ?? undefined,
          waist: row.waist ?? undefined,
          hip: row.hip ?? undefined,
          belly: row.belly ?? undefined,
          upperArm: row.upper_arm ?? undefined,
          thigh: row.thigh ?? undefined,
          updatedAt: row.updated_at,
        })
      } catch { /* skip invalid */ }
    }
  }
}

/** Run sync if last sync was more than 24h ago */
export async function syncIfNeeded(): Promise<void> {
  const lastSync = localStorage.getItem(SYNC_KEY)
  const now = Date.now()

  if (lastSync && now - Number(lastSync) < SYNC_INTERVAL) return

  const deviceId = getDeviceId()
  try {
    // Always pull first to restore any missing local data
    await pullFromCloud(deviceId)
    // Then push local changes (only newer entries overwrite remote)
    await pushToCloud(deviceId)
    localStorage.setItem(SYNC_KEY, String(now))
    console.log('Cloud sync completed')
  } catch (err) {
    console.error('Cloud sync failed:', err)
  }
}
