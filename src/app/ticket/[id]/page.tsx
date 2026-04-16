"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

const CIRCUMFERENCE = 2 * Math.PI * 130; // ≈ 816.8

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/queue/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItem(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleCancel = async () => {
    if (!confirm("هل أنت متأكد من إلغاء الدور؟")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) throw new Error("فشل الإلغاء");
      fetchStatus();
    } catch {
      alert("حدث خطأ");
    } finally {
      setCancelling(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <style>{styles}</style>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────
  if (!item) {
    return (
      <div className="loading-screen">
        <p style={{ color: "#bbcac6", fontSize: "1.1rem" }}>الرقم غير موجود</p>
        <button className="cancel-btn" onClick={() => router.push("/register")}>
          العودة للتسجيل
        </button>
        <style>{styles}</style>
      </div>
    );
  }

  const progress = item.totalToday > 0 ? item.doneToday / item.totalToday : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  // ── CALLED: full-screen green ────────────────────────────────────────
  if (item.status === "CALLED") {
    return (
      <div className="called-screen">
        <div className="called-icon">🔔</div>
        <div className="called-title">دورك الآن!</div>
        <div className="called-sub">تفضل للمكتب</div>
        <div className="called-badge">{item.queueNumber}</div>
        <style>{styles}</style>
      </div>
    );
  }

  // ── DONE / CANCELLED / SKIPPED ───────────────────────────────────────
  if (["DONE", "CANCELLED", "SKIPPED"].includes(item.status)) {
    const finalMap: Record<string, { icon: string; title: string; color: string }> = {
      DONE:      { icon: "✓",  title: "تمت خدمتك بنجاح",  color: "#14b8a6" },
      CANCELLED: { icon: "✕",  title: "تم إلغاء الدور",    color: "#ef4444" },
      SKIPPED:   { icon: "⟫",  title: "تم تخطي دورك",     color: "#f59e0b" },
    };
    const { icon, title, color } = finalMap[item.status];
    return (
      <div className="loading-screen">
        <div style={{ fontSize: "4rem", color, marginBottom: "1rem" }}>{icon}</div>
        <div style={{ fontSize: "1.4rem", fontWeight: 800, color, marginBottom: "0.5rem" }}>{title}</div>
        <div style={{ color: "#bbcac6" }}>{item.queueNumber}</div>
        <style>{styles}</style>
      </div>
    );
  }

  // ── WAITING ──────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="bg-decoration top" />
      <div className="bg-decoration bottom" />

      {/* Main */}
      <main className="main-content">

        {/* Circular progress */}
        <section className="hero-section">
          <div className="circle-wrapper">
            <div className="circle-glow" />
            <svg className="circle-svg" viewBox="0 0 288 288">
              <circle cx="144" cy="144" r="130" className="circle-track" />
              <circle
                cx="144" cy="144" r="130"
                className="circle-fill"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="circle-center">
              <span className="circle-label">باقي عليك</span>
              <span className="circle-number">{item.waitingCount}</span>
              <span className="circle-unit">عملاء</span>
            </div>
          </div>

          {/* Queue badge */}
          <div className="queue-badge">
            <span className="badge-label">رقمك في الطابور:</span>
            <span className="badge-number">{item.queueNumber}</span>
          </div>
        </section>

        {/* Status card */}
        <section className="status-card">
          <div className="status-row">
            <div className="serving-indicator">
              <span className="pulse-dot" />
              <span className="serving-text">
                يُخدَم الآن: <strong className="serving-number">{item.nowServing}</strong>
              </span>
            </div>
            <span className="position-text">
              {item.waitingCount === 0 ? "أنت التالي 🎯" : `بعدك ${item.waitingCount}`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="progress-section">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <div className="progress-meta">
              <span>{item.doneToday} من أصل {item.totalToday} تم خدمتهم</span>
              <span className="progress-pct">{Math.round(progress * 100)}%</span>
            </div>
          </div>
        </section>

        {/* Info grid */}
        <div className="info-grid">
          <div className="info-card">
            <span className="info-icon">👤</span>
            <span className="info-label">الاسم</span>
            <span className="info-value">{item.name}</span>
          </div>
          <div className="info-card">
            <span className="info-icon">🎟️</span>
            <span className="info-label">رقم التذكرة</span>
            <span className="info-value">{item.queueNumber}</span>
          </div>
        </div>

        {/* Refresh hint */}
        <div className="refresh-hint">
          <span className="refresh-spin">⟳</span>
          <span>يتحدث تلقائياً كل 5 ثوانٍ</span>
        </div>

        {/* Cancel button */}
        <button
          className="cancel-btn"
          onClick={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? "جاري الإلغاء..." : "إلغاء الدور"}
        </button>
      </main>
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Tajawal', sans-serif;
    background: #0b1326;
    color: #dae2fd;
    min-height: 100dvh;
    direction: rtl;
    overflow-x: hidden;
  }

  /* ── Loading / Final screens ── */
  .loading-screen {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100dvh; gap: 1rem; background: #0b1326;
  }
  .loading-spinner {
    width: 48px; height: 48px;
    border: 4px solid #2d3449;
    border-top-color: #4fdbc8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* ── Called screen ── */
  .called-screen {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100dvh; gap: 1rem;
    background: linear-gradient(135deg, #064e3b 0%, #0b1326 100%);
    animation: fadeIn 0.4s ease;
  }
  .called-icon { font-size: 5rem; animation: bounce 1s infinite; }
  .called-title { font-size: 2.5rem; font-weight: 900; color: #4fdbc8; }
  .called-sub { font-size: 1.2rem; color: #a7f3d0; }
  .called-badge {
    margin-top: 1rem; padding: 0.6rem 2rem;
    background: rgba(79,219,200,0.15); border: 2px solid #4fdbc8;
    border-radius: 9999px; font-size: 2rem; font-weight: 900; color: #4fdbc8;
  }

  /* ── Background decorations ── */
  .bg-decoration {
    position: fixed; pointer-events: none; border-radius: 50%; filter: blur(120px); z-index: 0;
  }
  .bg-decoration.top {
    top: -10%; right: -10%; width: 50%; height: 50%;
    background: rgba(79,219,200,0.05);
  }
  .bg-decoration.bottom {
    bottom: -10%; left: -10%; width: 40%; height: 40%;
    background: rgba(20,184,166,0.05);
  }

  /* ── Main ── */
  .main-content {
    position: relative; z-index: 1;
    padding: 2rem 1.5rem 2rem;
    max-width: 480px; margin: 0 auto;
    display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
  }

  /* ── Circular progress ── */
  .hero-section { display: flex; flex-direction: column; align-items: center; gap: 2rem; }
  .circle-wrapper {
    position: relative; width: 18rem; height: 18rem;
    display: flex; align-items: center; justify-content: center;
  }
  .circle-glow {
    position: absolute; inset: 0;
    background: rgba(20,184,166,0.08);
    border-radius: 50%; filter: blur(60px);
  }
  .circle-svg {
    width: 100%; height: 100%;
    transform: rotate(-90deg);
    position: relative; z-index: 1;
  }
  .circle-track {
    fill: transparent; stroke: #2d3449; stroke-width: 12;
  }
  .circle-fill {
    fill: transparent; stroke: #14b8a6; stroke-width: 12;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s ease;
  }
  .circle-center {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; z-index: 2;
  }
  .circle-label { font-size: 1.05rem; color: #bbcac6; font-weight: 500; margin-bottom: 0.25rem; }
  .circle-number { font-size: 5.5rem; font-weight: 900; color: #4fdbc8; line-height: 1; }
  .circle-unit { font-size: 1.2rem; color: #bbcac6; font-weight: 700; margin-top: 0.25rem; }

  .queue-badge {
    display: flex; align-items: center; gap: 0.75rem;
    background: #222a3d; padding: 0.75rem 1.5rem; border-radius: 9999px;
  }
  .badge-label { color: #bbcac6; font-weight: 500; }
  .badge-number { font-size: 1.5rem; font-weight: 900; color: #4fdbc8; }

  /* ── Status card ── */
  .status-card {
    width: 100%; background: #131b2e;
    border-radius: 2rem; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;
  }
  .status-row { display: flex; justify-content: space-between; align-items: center; }
  .serving-indicator { display: flex; align-items: center; gap: 0.75rem; }
  .pulse-dot {
    width: 0.75rem; height: 0.75rem; border-radius: 50%;
    background: #14b8a6; position: relative; flex-shrink: 0;
    animation: ping 1.5s ease-in-out infinite;
  }
  .serving-text { font-size: 1.05rem; font-weight: 700; }
  .serving-number { color: #4fdbc8; font-size: 1.15rem; font-weight: 900; }
  .position-text { font-size: 0.85rem; color: #bbcac6; }

  .progress-section { display: flex; flex-direction: column; gap: 0.6rem; }
  .progress-track {
    width: 100%; height: 0.75rem;
    background: #2d3449; border-radius: 9999px; overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(to left, #14b8a6, #4fdbc8);
    border-radius: 9999px;
    transition: width 1s ease;
    min-width: 4px;
  }
  .progress-meta {
    display: flex; justify-content: space-between;
    font-size: 0.8rem; color: #bbcac6;
  }
  .progress-pct { color: #4fdbc8; font-weight: 700; }

  /* ── Info grid ── */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; width: 100%; }
  .info-card {
    background: #222a3d; border-radius: 1.5rem;
    padding: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem;
  }
  .info-icon { font-size: 1.4rem; }
  .info-label { font-size: 0.75rem; color: #bbcac6; }
  .info-value { font-size: 0.95rem; font-weight: 700; }

  /* ── Refresh hint ── */
  .refresh-hint {
    display: flex; align-items: center; gap: 0.4rem;
    font-size: 0.75rem; color: rgba(187,202,198,0.6);
  }
  .refresh-spin { animation: spin 2s linear infinite; display: inline-block; font-size: 1rem; }

  /* ── Cancel button ── */
  .cancel-btn {
    width: 100%; padding: 0.875rem;
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
    color: #f87171; border-radius: 1rem; font-family: 'Tajawal', sans-serif;
    font-size: 1rem; font-weight: 700; cursor: pointer;
    transition: background 0.2s;
  }
  .cancel-btn:hover { background: rgba(239,68,68,0.2); }
  .cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Animations ── */
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes bounce { 0%,100% { transform: translateY(-10%); } 50% { transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
  @keyframes ping {
    0%   { box-shadow: 0 0 0 0 rgba(20,184,166,0.6); }
    70%  { box-shadow: 0 0 0 8px rgba(20,184,166,0); }
    100% { box-shadow: 0 0 0 0 rgba(20,184,166,0); }
  }
`;
