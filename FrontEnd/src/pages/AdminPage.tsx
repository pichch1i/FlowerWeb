import { type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  fetchAdminDashboard,
  isAdminConfigured,
  type AdminDashboardData,
  type AdminRecord,
} from '../services/adminApi'
import './AdminPage.css'

const ADMIN_SESSION_KEY = 'flower-admin-password'

type AdminView = 'logs' | 'responses'

function formatValue(value: string | undefined) {
  if (!value) {
    return '—'
  }

  return value
}

function pick(record: AdminRecord, keys: string[]) {
  const key = keys.find((candidate) => record[candidate])
  return key ? record[key] : ''
}

function AdminPage() {
  const [password, setPassword] = useState(
    () => window.sessionStorage.getItem(ADMIN_SESSION_KEY) ?? '',
  )
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(password))
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeView, setActiveView] = useState<AdminView>('logs')

  const summary = useMemo(() => {
    const logs = data?.logs ?? []
    const responses = data?.responses ?? []
    const uniqueSessions = new Set(
      logs
        .map((log) => pick(log, ['Session ID']))
        .filter(Boolean),
    ).size
    const firstPageViews = logs.filter(
      (log) =>
        pick(log, ['Event Type']) === 'page_view' &&
        pick(log, ['Page']) === 'intro',
    ).length
    const buttonClicks = logs.filter(
      (log) => pick(log, ['Event Type']) === 'button_click',
    ).length

    return {
      responses: responses.length,
      logs: logs.length,
      uniqueSessions,
      firstPageViews,
      buttonClicks,
    }
  }, [data])

  const loadDashboard = async (nextPassword = password) => {
    if (!nextPassword.trim()) {
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const nextData = await fetchAdminDashboard(nextPassword.trim(), 300)
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, nextPassword.trim())
      setData(nextData)
      setIsLoggedIn(true)
      setStatus('idle')
    } catch (error) {
      setStatus('error')
      setIsLoggedIn(false)
      setData(null)
      setErrorMessage(
        error instanceof Error && error.message === 'unauthorized'
          ? 'รหัสผ่านไม่ถูกต้อง'
          : 'ยังโหลดข้อมูลไม่ได้ กรุณาตรวจ Apps Script และลองใหม่อีกครั้ง',
      )
    }
  }

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void loadDashboard(password)
  }

  useEffect(() => {
    if (password) {
      void loadDashboard(password)
    }
    // Run once to restore a previously logged-in admin session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isAdminConfigured()) {
    return (
      <main className="admin-page">
        <section className="admin-card admin-card--login">
          <p className="admin-eyebrow">Boomscape Admin</p>
          <h1>ยังไม่ได้ตั้งค่า Google Sheets endpoint</h1>
          <p>
            กรุณาตั้งค่า VITE_GOOGLE_SHEETS_WEB_APP_URL ก่อนเปิดหน้า admin
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="admin-page">
      {isLoggedIn ? (
        <>
          <button
            className="admin-menu-button"
            type="button"
            aria-label={isMenuOpen ? 'ปิดเมนู admin' : 'เปิดเมนู admin'}
            aria-expanded={isMenuOpen}
            aria-controls="admin-sidebar"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>

          {isMenuOpen ? (
            <button
              className="admin-menu-backdrop"
              type="button"
              aria-label="ปิดเมนู"
              onClick={() => setIsMenuOpen(false)}
            />
          ) : null}

          <aside
            id="admin-sidebar"
            className={`admin-sidebar${isMenuOpen ? ' admin-sidebar--open' : ''}`}
            aria-label="เมนูข้อมูล admin"
          >
            <div className="admin-sidebar__brand">
              <span>☰</span>
              <div>
                <strong>Boomscape</strong>
                <small>Admin menu</small>
              </div>
            </div>

            <nav className="admin-nav" aria-label="เลือกข้อมูลที่ต้องการดู">
              <button
                type="button"
                className={activeView === 'logs' ? 'admin-nav__item admin-nav__item--active' : 'admin-nav__item'}
                onClick={() => {
                  setActiveView('logs')
                  setIsMenuOpen(false)
                }}
              >
                <span>Log</span>
                <small>{summary.logs} รายการ</small>
              </button>

              <button
                type="button"
                className={activeView === 'responses' ? 'admin-nav__item admin-nav__item--active' : 'admin-nav__item'}
                onClick={() => {
                  setActiveView('responses')
                  setIsMenuOpen(false)
                }}
              >
                <span>Responses</span>
                <small>{summary.responses} รายการ</small>
              </button>
            </nav>
          </aside>
        </>
      ) : null}

      <section className="admin-shell" aria-labelledby="admin-title">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">Boomscape Admin</p>
            <h1 id="admin-title">แดชบอร์ดการใช้งานเว็บไซต์</h1>
            <p>ดูข้อมูลคนเข้าเว็บ การกดปุ่ม และผลลัพธ์ล่าสุดจาก Google Sheet</p>
          </div>

          {isLoggedIn ? (
            <div className="admin-actions">
              <button type="button" onClick={() => void loadDashboard()}>
                รีเฟรชข้อมูล
              </button>
              <button
                type="button"
                onClick={() => {
                  window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
                  setIsLoggedIn(false)
                  setPassword('')
                  setData(null)
                }}
              >
                ออกจากระบบ
              </button>
            </div>
          ) : null}
        </header>

        {!isLoggedIn ? (
          <form className="admin-card admin-card--login" onSubmit={handleLogin}>
            <label htmlFor="admin-password">รหัสผ่าน</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="กรอกรหัสผ่าน admin"
              autoComplete="current-password"
              required
            />
            <button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'กำลังเข้าสู่ระบบ' : 'เข้าสู่ระบบ'}
            </button>
            {errorMessage ? (
              <p className="admin-error" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </form>
        ) : (
          <>
            <section className="admin-stats" aria-label="ภาพรวม">
              <article>
                <span>Responses</span>
                <strong>{summary.responses}</strong>
              </article>
              <article>
                <span>Usage Logs</span>
                <strong>{summary.logs}</strong>
              </article>
              <article>
                <span>Unique Sessions</span>
                <strong>{summary.uniqueSessions}</strong>
              </article>
              <article>
                <span>เข้าหน้าแรก</span>
                <strong>{summary.firstPageViews}</strong>
              </article>
              <article>
                <span>คลิกปุ่ม</span>
                <strong>{summary.buttonClicks}</strong>
              </article>
            </section>

            <section className="admin-grid">
              {activeView === 'logs' ? (
                <DashboardTable
                  title="Log การใช้งานล่าสุด"
                  records={data?.logs ?? []}
                  columns={[
                    'เวลาที่บันทึก (Google)',
                    'Event Type',
                    'Page',
                    'Target',
                    'Submission ID',
                    'Details',
                    'Viewport',
                  ]}
                />
              ) : (
                <DashboardTable
                  title="Responses ล่าสุด"
                  records={data?.responses ?? []}
                  columns={[
                    'เวลาที่บันทึก (Google)',
                    'ชื่อ–นามสกุล',
                    'อายุ',
                    'อาชีพ',
                    'ผลอารมณ์',
                    'ดอกไม้',
                    'ชื่อผลลัพธ์',
                    'ความคิดเห็นต่อผลลัพธ์',
                  ]}
                />
              )}
            </section>
          </>
        )}
      </section>
    </main>
  )
}

function DashboardTable({
  title,
  records,
  columns,
}: {
  title: string
  records: AdminRecord[]
  columns: string[]
}) {
  return (
    <section className="admin-card">
      <div className="admin-card__heading">
        <h2>{title}</h2>
        <span>{records.length} รายการ</span>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map((record, rowIndex) => (
                <tr key={`${title}-${rowIndex}`}>
                  {columns.map((column) => (
                    <td key={column}>{formatValue(record[column])}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>ยังไม่มีข้อมูล</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default AdminPage
