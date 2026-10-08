import { createClient } from '@supabase/supabase-js'

const requiredEnvironment = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
]

for (const name of requiredEnvironment) {
  if (!process.env[name]) {
    throw new Error(`Missing ${name}`)
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const { data: usersData, error: listError } =
  await supabase.auth.admin.listUsers()

if (listError) throw listError

const normalizedEmail = process.env.ADMIN_EMAIL.trim().toLowerCase()
const existingUser = usersData.users.find(
  (user) => user.email?.toLowerCase() === normalizedEmail,
)

if (existingUser) {
  const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
    password: process.env.ADMIN_PASSWORD,
    email_confirm: true,
    app_metadata: { ...existingUser.app_metadata, role: 'admin' },
  })

  if (error) throw error
  console.log(`Updated Supabase admin: ${normalizedEmail}`)
} else {
  const { error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: process.env.ADMIN_PASSWORD,
    email_confirm: true,
    app_metadata: { role: 'admin' },
  })

  if (error) throw error
  console.log(`Created Supabase admin: ${normalizedEmail}`)
}
