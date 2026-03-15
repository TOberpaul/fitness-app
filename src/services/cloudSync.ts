import { supabase } from './supabase'
import {
  getAllData,
  getDailyMeasurement,
  getWeeklyMeasurement,
  saveDailyMeasurement,
  saveWeeklyMeasurement,
} from './dataService'
import { getDB } from './db'
import type { Goal, Streaks, Milestone } from '../types'

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

  // Sync goals
  const db = await getDB()
  const goals: Goal[] = await db.getAll('goals')

  for (const g of goals) {
    const { data: remote } = await supabase
      .from('goals')
      .select('updated_at')
      .eq('device_id', deviceId)
      .eq('id', g.id)
      .maybeSingle()

    if (remote && remote.updated_at >= g.updatedAt) continue

    await supabase.from('goals').upsert({
      device_id: deviceId,
      id: g.id,
      metric_type: g.metricType,
      zone: g.zone ?? null,
      start_value: g.startValue,
      target_value: g.targetValue,
      deadline: g.deadline ?? null,
      created_at: g.createdAt,
      status: g.status,
      reached_at: g.reachedAt ?? null,
      updated_at: g.updatedAt,
    }, { onConflict: 'device_id,id' })
  }

  // Sync milestones
  const milestones: Milestone[] = await db.getAll('milestones')

  for (const m of milestones) {
    await supabase.from('milestones').upsert({
      device_id: deviceId,
      id: m.id,
      type: m.type,
      label: m.label,
      earned_at: m.earnedAt,
      notified: m.notified,
    }, { onConflict: 'device_id,id' })
  }

  // Sync streaks (singleton)
  const streaks: Streaks | undefined = await db.get('streaks', 'current')

  if (streaks) {
    const { data: remote } = await supabase
      .from('streaks')
      .select('updated_at')
      .eq('device_id', deviceId)
      .maybeSingle()

    if (!remote || remote.updated_at < streaks.updatedAt) {
      await supabase.from('streaks').upsert({
        device_id: deviceId,
        daily_streak: streaks.dailyStreak,
        daily_last_date: streaks.dailyLastDate,
        weekly_streak: streaks.weeklyStreak,
        weekly_last_date: streaks.weeklyLastDate,
        updated_at: streaks.updatedAt,
      }, { onConflict: 'device_id' })
    }
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

  // Pull goals
  const db = await getDB()
  const { data: goalRows } = await supabase
    .from('goals')
    .select('*')
    .eq('device_id', deviceId)

  if (goalRows) {
    for (const row of goalRows) {
      const local = await db.get('goals', row.id)
      if (local && local.updatedAt >= row.updated_at) continue

      try {
        const goal: Goal = {
          id: row.id,
          metricType: row.metric_type,
          zone: row.zone ?? undefined,
          startValue: row.start_value,
          targetValue: row.target_value,
          deadline: row.deadline ?? undefined,
          createdAt: row.created_at,
          status: row.status,
          reachedAt: row.reached_at ?? undefined,
          updatedAt: row.updated_at,
        }
        await db.put('goals', goal)
      } catch { /* skip invalid */ }
    }
  }

  // Pull milestones (no updated_at, always sync)
  const { data: milestoneRows } = await supabase
    .from('milestones')
    .select('*')
    .eq('device_id', deviceId)

  if (milestoneRows) {
    for (const row of milestoneRows) {
      try {
        const milestone: Milestone = {
          id: row.id,
          type: row.type,
          label: row.label,
          earnedAt: row.earned_at,
          notified: row.notified,
        }
        await db.put('milestones', milestone)
      } catch { /* skip invalid */ }
    }
  }

  // Pull streaks (singleton)
  const { data: streakRows } = await supabase
    .from('streaks')
    .select('*')
    .eq('device_id', deviceId)

  if (streakRows && streakRows.length > 0) {
    const row = streakRows[0]
    const local = await db.get('streaks', 'current')
    if (!local || local.updatedAt < row.updated_at) {
      try {
        const streaks: Streaks = {
          dailyStreak: row.daily_streak,
          dailyLastDate: row.daily_last_date,
          weeklyStreak: row.weekly_streak,
          weeklyLastDate: row.weekly_last_date,
          updatedAt: row.updated_at,
        }
        await db.put('streaks', streaks, 'current')
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
