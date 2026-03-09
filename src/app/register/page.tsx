"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, MapPin, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "" }); // Only store the 9 digits in state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(true);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [initLoading, setInitLoading] = useState(true);

  const requestLocation = () => {
    setLocLoading(true);
    setError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocLoading(false);
        },
        (err) => {
          let msg = "حدث خطأ غير متوقع أثناء تحديد الموقع";
          if (err.code === 1) msg = "يجب السماح بالوصول للموقع الجغرافي للتسجيل";
          else if (err.code === 2) msg = "تعذر تحديد الموقع الجغرافي، يرجى التأكد من تفعيل الـ GPS";
          else if (err.code === 3) msg = "انتهت مهلة تحديد الموقع، يرجى المحاولة مرة أخرى";
          
          setError(msg);
          setLocLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError("متصفحك لا يدعم تحديد الموقع");
      setLocLoading(false);
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/settings?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setIsRegistrationOpen(data.isOpen === true || data.isOpen === 1);
        }
      } catch (err) {
        console.error("Error fetching status:", err);
      } finally {
        setInitLoading(false);
      }
    };
    checkStatus();
    requestLocation();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      setError("يرجى تفعيل الموقع للتسجيل");
      return;
    }
    
    // Validate phone number: must be exactly 9 digits
    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(form.phone)) {
      setError("يرجى إدخال 9 أرقام صحيحة بعد رمز الدولة");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...form, 
          phone: "966" + form.phone,
          latitude: location.lat, 
          longitude: location.lng 
        }),
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response received:", text);
        throw new Error("حدث خطأ في النظام (استجابة غير صالحة). يرجى التأكد من تشغيل الخادم.");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ غير متوقع");
      router.push(`/ticket/${data.id}`);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div className="container text-center" style={{ paddingTop: "10rem" }}>
        <Loader2 className="animate-spin" size={40} color="var(--accent)" />
      </div>
    );
  }

  if (!isRegistrationOpen) {
    return (
      <main className="container animate-fade" style={{ maxWidth: "500px", marginTop: "10rem" }}>
        <div className="card text-center" style={{ padding: "3rem 2rem" }}>
          <div style={{ 
            width: "80px", 
            height: "80px", 
            background: "rgba(239, 68, 68, 0.1)", 
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            margin: "0 auto 2rem",
            color: "var(--danger)"
          }}>
            <MapPin size={40} />
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "1rem", color: "var(--primary)" }}>عذراً، التسجيل مغلق حالياً</h1>
          <div style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.8, textAlign: "right", display: "inline-block", margin: "0 auto" }}>
            <p>• سيفتح الرابط قبل الموعد بساعة واحدة.</p>
            <p>• التسجيل يتطلب وجودك داخل الموقع الجغرافي للمكتب.</p>
          </div>
          <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--card-border)" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>شكراً لتفهمكم</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container animate-fade">
      <div style={{ marginTop: "4rem" }}></div>

      <div className="card">
        <h2 style={{ marginBottom: "2rem", textAlign: "center", fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)" }}>
          {process.env.NEXT_PUBLIC_REGISTER_TITLE || "تسجيل طلب انتظار لبصمة الشنغن"}
        </h2>

        {error && (
          <div
            style={{
              padding: "1rem",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid var(--danger)",
              borderRadius: "var(--radius)",
              color: "var(--danger)",
              marginBottom: "1rem",
              fontSize: "0.9rem",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label className="label">
              <User size={14} style={{ marginLeft: "4px" }} /> الاسم الثنائي
            </label>
            <input 
              type="text" 
              placeholder="" 
              required 
              maxLength={20}
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              disabled={loading} 
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label">
              <Phone size={14} style={{ marginLeft: "4px" }} /> رقم الجوال
            </label>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              direction: "ltr", // Fixed '966' is on the left
              background: "var(--background)",
              border: "1px solid var(--card-border)",
              borderRadius: "var(--radius)",
              overflow: "hidden"
            }}>
              <span style={{ 
                padding: "0 1rem", 
                height: "100%", 
                display: "flex", 
                alignItems: "center", 
                background: "rgba(0,0,0,0.05)", 
                fontWeight: 700,
                color: "var(--muted)",
                borderRight: "1px solid var(--card-border)"
              }}>
                966
              </span>
              <input 
                type="tel" 
                placeholder="5xxxxxxxx" 
                required 
                value={form.phone} 
                onFocus={(e) => {
                  // Ensure formatting is correct on focus
                }}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  
                  if (val.length > 0 && val[0] !== "5") {
                    setError("يجب أن يبدأ رقم الجوال بالرقم 5 مباشرة (5xxxxxxxx)");
                    return;
                  }
                  
                  // Clear error if they start typing correctly
                  if (error && val[0] === "5") {
                    setError(null);
                  }

                  setForm({ ...form, phone: val.slice(0, 9) });
                }} 
                disabled={loading} 
                style={{ 
                  border: "none", 
                  margin: 0, 
                  borderRadius: 0, 
                  textAlign: "left",
                  background: "transparent"
                }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading || locLoading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : "تسجيل في الطابور"}
          </button>
        </form>

        <div
          style={{
            marginTop: "1.5rem",
            padding: "0.5rem",
            background: "rgba(0,0,0,0.03)",
            borderRadius: "var(--radius)",
            fontSize: "0.8rem",
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            flexDirection: "column"
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={12} />
            {locLoading ? "جاري تحديد الموقع..." : location ? "تم تحديد الموقع بنجاح" : "بانتظار اذن الموقع..."}
          </div>
          {!locLoading && !location && (
            <button 
              type="button"
              className="btn btn-outline" 
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginTop: '0.5rem' }}
              onClick={requestLocation}
            >
              تحديث الموقع / المحاولة مرة أخرى
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
