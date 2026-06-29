import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const today = new Date()
today.setUTCHours(0, 0, 0, 0)

function isLastDayOfMonth() {
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.getMonth() !== today.getMonth()
}

function getPeriodType() {
  const input = process.env.PERIOD_TYPE
  if (input && input !== 'auto') return input
  if (today.getMonth() === 11 && today.getDate() === 31) return 'yearly'
  if (isLastDayOfMonth()) return 'monthly'
  return 'weekly'
}

function getWeekRange() {
  const end = new Date(today)
  end.setDate(today.getDate() - 1) // yesterday (Saturday)
  const start = new Date(end)
  start.setDate(end.getDate() - 6)
  return { start, end }
}

function getMonthRange() {
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const end = new Date(today)
  return { start, end }
}

function getYearRange() {
  const start = new Date(today.getFullYear(), 0, 1)
  const end = new Date(today)
  return { start, end }
}

async function fetchEntries(userId, start, end) {
  const { data } = await supabase
    .from('entries')
    .select('content, moods, entry_type, photo_url, created_at')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: true })
  return data || []
}

function countMoods(entries) {
  const counts = {}
  for (const e of entries) {
    for (const m of (e.moods || [])) {
      counts[m] = (counts[m] || 0) + 1
    }
  }
  return counts
}

function countDays(entries) {
  const days = new Set(entries.map(e => e.created_at.slice(0, 10)))
  return days.size
}

function buildEntriesText(entries) {
  return entries
    .filter(e => e.content)
    .map(e => {
      const date = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const time = new Date(e.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      const moods = e.moods?.length ? ` [${e.moods.join(' ')}]` : ''
      return `${date} ${time}${moods}: ${e.content}`
    })
    .join('\n')
}

async function generateSummary(entries, periodType, start, end) {
  if (entries.length === 0) return null

  const entriesText = buildEntriesText(entries)
  const periodLabel = periodType === 'weekly' ? 'week' : periodType === 'monthly' ? 'month' : 'year'

  const isYearly = periodType === 'yearly'
  const isMonthly = periodType === 'monthly'

  const prompt = `You are generating a private personal journal summary. These are raw journal entries captured throughout a ${periodLabel}. Write in second person ("you", "your").

ENTRIES:
${entriesText}

Generate a JSON response with this exact structure:
{
  "narrative": "2-4 sentence honest narrative summary of this ${periodLabel}. Specific, not generic. Reference real things from the entries.",
  "highlights": ["notable moment 1", "notable moment 2"],
  ${isMonthly || isYearly ? `"accomplishments": ["thing accomplished", "..."],
  "highs": ["a high point", "..."],
  "lows": ["a low point", "..."],
  "trips": ["place visited or new experience", "..."],` : ''}
}

Rules:
- Be honest and specific. Reference actual content from entries.
- highlights/highs/lows/accomplishments/trips: only include if genuinely present in entries. Empty array if nothing fits.
- trips: include any travel, new places visited, or notable new experiences.
- accomplishments: concrete things finished or achieved.
- narrative: conversational, warm, not clinical. Like a friend who read your journal.
- Keep each list item under 15 words.
- Return ONLY the JSON, no other text.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  })

  const raw = response.content[0].text.trim()
  return JSON.parse(raw)
}

async function generateForUser(userId, periodType) {
  let start, end
  if (periodType === 'weekly') ({ start, end } = getWeekRange())
  else if (periodType === 'monthly') ({ start, end } = getMonthRange())
  else ({ start, end } = getYearRange())

  const entries = await fetchEntries(userId, start, end)
  if (entries.length === 0) {
    console.log(`No entries for user ${userId} in ${periodType} period. Skipping.`)
    return
  }

  const aiData = await generateSummary(entries, periodType, start, end)
  if (!aiData) return

  const moodCounts = countMoods(entries)
  const daysCaptured = countDays(entries)

  const summaryRow = {
    user_id: userId,
    period_type: periodType,
    period_start: start.toISOString().slice(0, 10),
    period_end: end.toISOString().slice(0, 10),
    ai_narrative: aiData.narrative,
    mood_counts: moodCounts,
    highlights: aiData.highlights || [],
    accomplishments: aiData.accomplishments || [],
    highs: aiData.highs || [],
    lows: aiData.lows || [],
    trips: aiData.trips || [],
    entry_count: entries.length,
    days_captured: daysCaptured,
    generated_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Upsert: replace if same period already exists
  const { error } = await supabase
    .from('summaries')
    .upsert(summaryRow, {
      onConflict: 'user_id,period_type,period_start',
      ignoreDuplicates: false
    })

  if (error) {
    console.error(`Error saving summary for user ${userId}:`, error)
  } else {
    console.log(`Generated ${periodType} summary for user ${userId}: ${entries.length} entries, ${daysCaptured} days`)
  }
}

async function main() {
  const periodType = getPeriodType()
  console.log(`Generating ${periodType} summaries for ${today.toDateString()}`)

  // Get all users who have entries
  const { data: users } = await supabase
    .from('entries')
    .select('user_id')
    .limit(1000)

  if (!users || users.length === 0) {
    console.log('No users with entries found.')
    return
  }

  const uniqueUsers = [...new Set(users.map(u => u.user_id))]
  console.log(`Processing ${uniqueUsers.length} user(s)`)

  for (const userId of uniqueUsers) {
    await generateForUser(userId, periodType)
  }

  console.log('Done.')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
