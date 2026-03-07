"use client";
import React, { useState, useEffect } from "react";
import { User, Hash, Clock, CheckCircle2, XCircle, SkipForward, Phone, Loader2, RefreshCw, Bell, MonitorPlay, QrCode, Settings as SettingsIcon, Save, MapPin, Trash2, Download, X, LogOut } from "lucide-react";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { 
  ssr: false,
  loading: () => <div style={{ height: '300px', width: '100%', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>جاري تحميل الخريطة...</div>
});

const STATUS_LABELS: Record<string, string> = {
  WAITING: "في الانتظار",
  CALLED: "تم الاستدعاء",
  DONE: "تمت الخدمة",
  CANCELLED: "تم الإلغاء",
  SKIPPED: "تم التخطي",
};

const SOUND_OPTIONS = [
  { name: "✈️ مطار 1 (نغمة موسيقية فخمة)", url: "https://assets.mixkit.co/active_storage/sfx/2855/2855-preview.mp3" },
  { name: "✈️ مطار 2 (نغمة كلاسيكية)", url: "https://assets.mixkit.co/active_storage/sfx/2854/2854-preview.mp3" },
  { name: "✈️ مطار 3 (تنبيه مزدوج)", url: "https://assets.mixkit.co/active_storage/sfx/2858/2858-preview.mp3" },
  { name: "🏥 مستشفى 1 (نداء هادئ)", url: "https://assets.mixkit.co/active_storage/sfx/2861/2861-preview.mp3" },
  { name: "🏥 مستشفى 2 (نداء إعلان)", url: "https://assets.mixkit.co/active_storage/sfx/2860/2860-preview.mp3" },
  { name: "🔊 تنبيه تقني (Digital)", url: "https://assets.mixkit.co/active_storage/sfx/2862/2862-preview.mp3" },
  { name: "🔊 تنبيه عالي (Alert)", url: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
  { name: "🔊 تنبيه نجاح (Success)", url: "https://assets.mixkit.co/active_storage/sfx/2863/2863-preview.mp3" },
  { name: "🔊 تنبيه تأكيد (Confirm)", url: "https://assets.mixkit.co/active_storage/sfx/2864/2864-preview.mp3" },
  { name: "🔔 جرس مكتب (دينغ)", url: "https://assets.mixkit.co/active_storage/sfx/2859/2859-preview.mp3" },
  { name: "🚪 جرس باب 1 (Classic)", url: "https://assets.mixkit.co/active_storage/sfx/2852/2852-preview.mp3" },
  { name: "🚪 جرس باب 2 (Electronic)", url: "https://assets.mixkit.co/active_storage/sfx/2857/2857-preview.mp3" },
];

export default function StaffDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ officeLat: 24.7136, officeLng: 46.6753, maxDistance: 500, bellUrl: SOUND_OPTIONS[0].url, webhookUrl: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const registerUrl = `${origin}/register`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(registerUrl)}`;

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/queue");
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Staff Dashboard: Non-JSON response received:", text);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(data);
    } catch (err) {
      console.error("Staff Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("هل أنت متأكد من إنهاء اليوم؟ سيتم مسح قائمة المراجعين استعداداً ليوم جديد.")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/queue", { method: "DELETE" });
      if (res.ok) {
        alert("تم إنهاء اليوم بنجاح وتم تصفير القائمة");
        await fetchQueue();
      } else {
        throw new Error("فشل الإنهاء");
      }
    } catch (err) {
      alert("حدث خطأ أثناء إنهاء اليوم");
    } finally {
      setResetting(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          officeLat: data.officeLat,
          officeLng: data.officeLng,
          maxDistance: data.maxDistance,
          bellUrl: data.bellUrl || SOUND_OPTIONS[0].url,
          webhookUrl: data.webhookUrl || ""
        });
      }
    } catch (err) {
      console.error("Fetch Settings Error:", err);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert("تم حفظ الإعدادات بنجاح");
        setShowSettings(false);
      } else {
        throw new Error("فشل الحفظ");
      }
    } catch (err) {
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSavingSettings(false);
    }
  };

  const playPreview = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(() => alert("يجب التفاعل مع الصفحة أولاً لتشغيل الصوت"));
  };

  const handleLogout = async () => {
    if (!confirm("هل تريد تسجيل الخروج؟")) return;
    await fetch("/api/auth/login", { method: "DELETE" });
    window.location.reload();
  };

  useEffect(() => {
    fetchQueue();
    fetchSettings();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("فشل التحديث");
      await fetchQueue();
    } catch (err) {
      alert("حدث خطأ");
    } finally {
      setUpdatingId(null);
    }
  };


  return (
    <main className="container" style={{ maxWidth: "1000px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          background: "var(--card)",
          padding: "1.5rem",
          borderRadius: "var(--radius)",
          border: "1px solid var(--card-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              background: "var(--accent)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <User size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>لوحة الموظف</h1>
            <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{items.length} مراجعين اليوم</p>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button 
            className="btn btn-outline" 
            onClick={handleReset}
            disabled={resetting}
            style={{ fontSize: "0.85rem", gap: "0.4rem", color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.2)" }}
          >
            {resetting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} إنهاء اليوم
          </button>
          <button 
            className={`btn ${showSettings ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setShowSettings(!showSettings)}
            style={{ fontSize: "0.85rem", gap: "0.4rem" }}
          >
            <SettingsIcon size={16} /> الإعدادات
          </button>
          <a href="/tv" target="_blank" className="btn btn-outline" style={{ fontSize: "0.85rem", gap: "0.4rem" }}>
            <MonitorPlay size={16} /> شاشة العرض
          </a>
          <div style={{ position: 'relative' }}>
            <button 
              className={`btn ${showQR ? 'btn-primary' : 'btn-outline'}`} 
              onClick={() => setShowQR(!showQR)}
              style={{ fontSize: "0.85rem", gap: "0.4rem" }}
            >
              <QrCode size={16} /> رابط العملاء
            </button>
            
            {showQR && (
              <div className="card animate-fade" style={{ 
                position: 'absolute', 
                top: '120%', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                zIndex: 100, 
                width: '320px', 
                padding: '1.5rem',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                border: '1px solid var(--accent)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>رابط تسجيل العملاء</h3>
                  <X size={18} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setShowQR(false)} />
                </div>
                
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                  <img src={qrImageUrl} alt="QR Code" style={{ width: '100%', height: 'auto' }} />
                </div>
                
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem', wordBreak: 'break-all', direction: 'ltr' }}>
                  {registerUrl}
                </div>
                
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', gap: '0.5rem', fontSize: '0.9rem' }}
                  onClick={async () => {
                    const response = await fetch(qrImageUrl);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'schengen-qr-code.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download size={16} /> تنزيل الباركود
                </button>
              </div>
            )}
          </div>
          <button className="btn btn-outline" onClick={fetchQueue} disabled={loading} style={{ background: "rgba(0,0,0,0.03)" }} title="تحديث البيانات">
            <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
          </button>
          
          <button 
            className="btn btn-outline" 
            onClick={handleLogout} 
            title="تسجيل الخروج"
            style={{ color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.2)" }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="card animate-fade" style={{ marginBottom: "2rem", border: "1px solid var(--accent)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--card-border)", paddingBottom: "0.5rem" }}>
            <SettingsIcon size={20} color="var(--accent)" />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>إعدادات النظام</h2>
          </div>
          
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--accent)" }}>🔔 اختيار صوت التنبيه</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {SOUND_OPTIONS.map((option) => (
                <div 
                  key={option.url} 
                  onClick={() => setSettings({ ...settings, bellUrl: option.url })}
                  style={{
                    padding: "1rem",
                    borderRadius: "12px",
                    border: settings.bellUrl === option.url ? "2px solid var(--accent)" : "1px solid var(--card-border)",
                    background: settings.bellUrl === option.url ? "rgba(245, 158, 11, 0.05)" : "rgba(0,0,0,0.02)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.8rem",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{option.name}</div>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: "0.4rem", fontSize: "0.75rem", width: "100%" }}
                    onClick={(e) => { e.stopPropagation(); playPreview(option.url); }}
                  >
                    <Bell size={12} /> تجربة الصوت
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600 }}>خط العرض (Latitude)</label>
              <div style={{ position: "relative" }}>
                <MapPin size={14} style={{ position: "absolute", top: "50%", right: "12px", transform: "translateY(-50%)", opacity: 0.5 }} />
                <input 
                  type="number" 
                  step="0.000001"
                  value={settings.officeLat} 
                  onChange={(e) => setSettings({...settings, officeLat: parseFloat(e.target.value)})}
                  style={{ width: "100%", padding: "0.8rem 2.5rem 0.8rem 12px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--card-border)", borderRadius: "8px" }}
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600 }}>خط الطول (Longitude)</label>
              <div style={{ position: "relative" }}>
                <MapPin size={14} style={{ position: "absolute", top: "50%", right: "12px", transform: "translateY(-50%)", opacity: 0.5 }} />
                <input 
                  type="number" 
                  step="0.000001"
                  value={settings.officeLng} 
                  onChange={(e) => setSettings({...settings, officeLng: parseFloat(e.target.value)})}
                  style={{ width: "100%", padding: "0.8rem 2.5rem 0.8rem 12px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--card-border)", borderRadius: "8px" }}
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600 }}>نطاق التسجيل (بالمتر)</label>
              <div style={{ position: "relative" }}>
                <Hash size={14} style={{ position: "absolute", top: "50%", right: "12px", transform: "translateY(-50%)", opacity: 0.5 }} />
                <input 
                  type="number" 
                  value={settings.maxDistance} 
                  onChange={(e) => setSettings({...settings, maxDistance: parseInt(e.target.value)})}
                  style={{ width: "100%", padding: "0.8rem 2.5rem 0.8rem 12px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--card-border)", borderRadius: "8px" }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "2rem", padding: "1.2rem", background: "rgba(0,0,0,0.02)", borderRadius: "12px", border: "1px solid var(--card-border)" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--accent)" }}>🌐 رابط الويب هوك (Webhook URL)</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "1rem" }}>💡 سيتم إرسال إشعار لهذا الرابط تلقائياً عند طلب كل عميل (يمكن استخدامه للربط مع واتساب أو برامج أخرى).</p>
            <input 
              type="url" 
              placeholder="https://example.com/webhook"
              value={settings.webhookUrl} 
              onChange={(e) => setSettings({...settings, webhookUrl: e.target.value})}
              style={{ width: "100%", padding: "0.8rem 12px", background: "white", border: "1px solid var(--card-border)", borderRadius: "8px" }}
            />
          </div>
          
          <div style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "0.5rem" }}>💡 يمكنك الضغط على الخريطة لتحديد موقع المكتب بدقة:</p>
            <MapPicker 
              lat={settings.officeLat} 
              lng={settings.officeLng} 
              onChange={(lat, lng) => setSettings({...settings, officeLat: lat, officeLng: lng})} 
            />
          </div>
          
          <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={handleSaveSettings} disabled={savingSettings} style={{ gap: "0.5rem" }}>
              {savingSettings ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} حفظ الإعدادات
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.03)", borderBottom: "1px solid var(--card-border)" }}>
                <th style={{ padding: "1.2rem", color: "var(--muted)", fontWeight: 600 }}>الرقم</th>
                <th style={{ padding: "1.2rem", color: "var(--muted)", fontWeight: 600 }}>الاسم</th>
                <th style={{ padding: "1.2rem", color: "var(--muted)", fontWeight: 600 }}>الحالة</th>
                <th style={{ padding: "1.2rem", color: "var(--muted)", fontWeight: 600 }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <td style={{ padding: "1.2rem", fontWeight: 900, color: "var(--accent)", fontSize: "1.3rem" }}>{item.queueNumber}</td>
                    <td style={{ padding: "1.2rem" }}>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                        <Phone size={10} /> {item.phone}
                      </div>
                    </td>
                    <td style={{ padding: "1.2rem" }}>
                      <span className={`badge badge-${item.status.toLowerCase()}`}>{STATUS_LABELS[item.status]}</span>
                    </td>
                    <td style={{ padding: "1.2rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                          {["WAITING", "CALLED"].includes(item.status) && (
                            <>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", gap: "0.3rem" }} 
                                onClick={() => updateStatus(item.id, "CALLED")} 
                                disabled={updatingId === item.id}
                                title={item.status === "CALLED" ? "إعادة استدعاء" : "استدعاء"}
                              >
                                <Bell size={14} /> {item.status === "CALLED" ? "تنبيه" : "استدعاء"}
                              </button>
                              
                              {item.status === "CALLED" && (
                                <button className="btn" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", background: "var(--success)", color: "white", gap: "0.3rem" }} onClick={() => updateStatus(item.id, "DONE")} disabled={updatingId === item.id}>
                                  <CheckCircle2 size={14} /> إنهاء
                                </button>
                              )}

                              <button className="btn btn-outline" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }} title="تخطي" onClick={() => updateStatus(item.id, "SKIPPED")} disabled={updatingId === item.id}>
                                <SkipForward size={14} />
                              </button>
                              
                              <button className="btn btn-outline" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", color: "var(--danger)" }} title="إلغاء" onClick={() => updateStatus(item.id, "CANCELLED")} disabled={updatingId === item.id}>
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          {updatingId === item.id && <Loader2 className="animate-spin" size={18} />}
                        </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
                    لا يوجد مراجعين حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
