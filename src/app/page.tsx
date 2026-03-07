"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, MapPin, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(true);

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
    requestLocation();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      setError("يرجى تفعيل الموقع للتسجيل");
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

  return (
    <main className="container animate-fade">
      <div className="text-center" style={{ marginBottom: "2rem" }}>
        <h1 className="h1">Tejwal Fingerprint</h1>
        <p style={{ color: "var(--muted)" }}>نظام تنظيم طابور البصمة</p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: "1.5rem", textAlign: "center", fontSize: "1.2rem" }}>تسجيل طلب انتظار</h2>

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
              <User size={14} style={{ marginLeft: "4px" }} /> الاسم الكامل
            </label>
            <input type="text" placeholder="فايز بن علي..." required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={loading} />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label">
              <Phone size={14} style={{ marginLeft: "4px" }} /> رقم الجوال
            </label>
            <input type="tel" placeholder="05xxxxxxxx" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={loading} />
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
