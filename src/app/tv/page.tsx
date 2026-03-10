"use client";
import React, { useState, useEffect, useRef } from "react";
import { User, Hash, Clock, AlarmClock, Bell, MonitorPlay } from "lucide-react";

export default function TVPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const lastCalledIdRef = useRef<number | null>(null);
  const lastUpdatedRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [bellUrl, setBellUrl] = useState("https://assets.mixkit.co/active_storage/sfx/2855/2855-preview.mp3");
  const isPlayingRef = useRef(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.bellUrl) setBellUrl(data.bellUrl);
      }
    } catch (err) {
      console.error("TV Settings Fetch Error:", err);
    }
  };

  const playBellThrice = () => {
    if (!audioRef.current || isPlayingRef.current) return;
    
    isPlayingRef.current = true;
    let count = 0;
    const playNext = () => {
      if (count < 3 && audioRef.current) {
        audioRef.current.volume = 1.0;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((e) => console.log("Audio play blocked"));
        count++;
        if (count < 3) {
          setTimeout(playNext, 2000); // Wait for sound to finish
        } else {
          isPlayingRef.current = false;
        }
      } else {
        isPlayingRef.current = false;
      }
    };
    playNext();
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/queue");
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("TV Page: Non-JSON response received:", text);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(data);

      const calledItems = data
        .filter((i: any) => i.status === "CALLED")
        .sort((a: any, b: any) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

      const latestCalled = calledItems.length > 0 ? calledItems[calledItems.length - 1] : null;

      if (latestCalled) {
        const isNewCall = latestCalled.id !== lastCalledIdRef.current || latestCalled.updatedAt !== lastUpdatedRef.current;
        
        if (isNewCall) {
          lastCalledIdRef.current = latestCalled.id;
          lastUpdatedRef.current = latestCalled.updatedAt;
          playBellThrice();
        }
      } else {
        lastCalledIdRef.current = null;
        lastUpdatedRef.current = null;
      }
    } catch (err) {
      console.error("TV Page Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchSettings();
    const queueInterval = setInterval(fetchQueue, 1000);
    const settingsInterval = setInterval(fetchSettings, 10000); // Update settings every 10s
    return () => {
      clearInterval(queueInterval);
      clearInterval(settingsInterval);
    };
  }, []);

  const nowServing = items.filter((i) => i.status === "CALLED");
  const waitingList = items.filter((i) => i.status === "WAITING");
  const waitingNext = waitingList.slice(0, 5);
  const totalWaiting = waitingList.length;

  return (
    <main className="tv-display">
      <audio ref={audioRef} src={bellUrl} preload="auto" />

      {/* Simplified Space */}
      <div style={{ marginBottom: "2rem" }}></div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "2rem", flex: 1 }}>
        {/* Serving Section */}
        <section
          className="card serving-now"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "3px solid var(--accent)",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 0 40px rgba(0,0,0,0.4), inset 0 0 20px rgba(245, 158, 11, 0.1)",
            padding: "4rem 2rem",
          }}
        >
          <div style={{ marginBottom: "1.5rem", color: "var(--accent)", fontWeight: 900, fontSize: "3rem", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>يتم الآن خدمة</div>

          {nowServing.length > 0 ? (
            <div className="animate-fade">
              <div style={{ fontSize: "18rem", fontWeight: 950, color: "white", lineHeight: 0.8, textShadow: "0 10px 40px rgba(0,0,0,0.8)" }}>
                {nowServing[nowServing.length - 1].queueNumber}
              </div>
              <div style={{ fontSize: "4.5rem", fontWeight: 800, marginTop: "2.5rem", color: "#e2e8f0" }}>
                {nowServing[nowServing.length - 1].name}
              </div>
            </div>
          ) : (
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "3.5rem", fontWeight: 700 }}>لا يوجد مراجعين حالياً</div>
          )}
        </section>

        {/* Sidebar: Next List */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ flex: 1, padding: "2rem", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
            <div style={{ marginBottom: "2rem", paddingBottom: "1.2rem", borderBottom: "2px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <User size={32} color="var(--accent)" />
                <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "white" }}>بانتظار دورهم</h2>
              </div>
              {totalWaiting > 0 && (
                <div style={{ 
                  background: "rgba(255,255,255,0.1)", 
                  padding: "0.5rem 1rem", 
                  borderRadius: "12px", 
                  fontSize: "1.2rem", 
                  fontWeight: 800, 
                  color: "var(--accent)",
                  border: "1px solid rgba(255,255,255,0.1)"
                }}>
                  {totalWaiting} مراجعين
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {waitingNext.length > 0 ? (
                waitingNext.map((item, idx) => (
                  <div
                    key={item.id}
                    className="animate-fade"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "1.5rem",
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: "16px",
                      borderRight: idx === 0 ? "6px solid var(--accent)" : "1px solid rgba(255,255,255,0.1)",
                      boxShadow: idx === 0 ? "0 8px 20px rgba(0,0,0,0.4)" : "none",
                      transform: idx === 0 ? "scale(1.02)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                      <span style={{ fontSize: "2.5rem", fontWeight: 950, color: "var(--accent)", textShadow: "0 0 15px rgba(245, 158, 11, 0.4)" }}>
                        {item.queueNumber}
                      </span>
                      <span style={{ fontSize: "1.6rem", fontWeight: 700, color: "white" }}>
                        {item.name}
                      </span>
                    </div>
                    {idx === 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "1rem", fontWeight: 700, color: "var(--accent)", background: "rgba(245, 158, 11, 0.15)", padding: "0.4rem 1rem", borderRadius: "999px", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                        <Bell size={16} fill="var(--accent)" /> استعد
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "4rem", fontSize: "1.5rem" }}>القائمة فارغة</div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Scrolling Ad Ticker (Seamless Infinite Loop Fix) */}
      <div 
        style={{ 
          position: "fixed", 
          bottom: 0, 
          left: 0, 
          right: 0, 
          background: "rgba(0,0,0,0.92)", 
          backdropFilter: "blur(20px)",
          borderTop: "4px solid var(--accent)",
          padding: "1.2rem 0",
          overflow: "hidden",
          zIndex: 100,
          direction: "ltr", // Force LTR for the ticker logic to be consistent
          boxShadow: "0 -10px 50px rgba(0,0,0,0.6)"
        }}
      >
        <div className="ticker-inner" style={{
          display: "flex",
          width: "max-content",
          animation: "ticker-infinite 60s linear infinite",
          fontSize: "2.2rem",
          fontWeight: 850,
          color: "white"
        }}>
          {/* We repeat the content to create a seamless loop */}
          {[1, 2, 3].map((loop) => (
            <div key={loop} style={{ display: "flex", alignItems: "center" }}>
              {[
                "✨ أهلاً بكم في مكتبنا لخدمات التأشيرات وبصمة الشنغن .. نسعد بخدمتكم دائماً",
                "📞 للتواصل والاستفسار عبر الواتساب: 9665XXXXXXXX",
                "🌍 خدماتنا: استخراج تأشيرات الشنغن، حجز مواعيد البصمة، تأمين سياحي دولي، ترجمة معتمدة",
                "📜 تنبيه: يرجى التأكد من صلاحية جواز السفر لأكثر من 6 أشهر قبل التقديم",
                "✈️ نوفر لكم باقات سياحية متكاملة وحجوزات طيران وفنادق بأسعار منافسة",
                "💡 نصيحة: يرجى إحضار أصل الهوية وجواز السفر عند مراجعة الموظف لتسريع الإجراءات"
              ].map((msg, i) => (
                <span key={i} style={{ padding: "0 5rem", display: "flex", alignItems: "center", gap: "5rem", direction: "rtl" }}>
                  {msg}
                  <span style={{ color: "var(--accent)", fontSize: "2.5rem" }}>★</span>
                </span>
              ))}
            </div>
          ))}
        </div>
        <style jsx>{`
          .ticker-inner {
            will-change: transform;
          }
          @keyframes ticker-infinite {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-33.33%, 0, 0); }
          }
        `}</style>
      </div>
    </main>
  );
}
