"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Redirect to dashboard
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "كلمة المرور غير صحيحة");
      }
    } catch (err) {
      setError("حدث خطأ أثناء محاولة تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container animate-fade" style={{ maxWidth: "400px", marginTop: "10rem" }}>
      <div className="card text-center">
        <div style={{ 
          width: "60px", 
          height: "60px", 
          background: "var(--accent)", 
          borderRadius: "15px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          margin: "0 auto 1.5rem",
          color: "white"
        }}>
          <Lock size={30} />
        </div>
        
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>الدخول للوحة التحكم</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>يرجى إدخال كلمة المرور للوصول إلى لوحة الموظف</p>

        {error && (
          <div style={{ 
            padding: "0.75rem", 
            background: "rgba(239, 68, 68, 0.1)", 
            color: "var(--danger)", 
            borderRadius: "var(--radius)", 
            marginBottom: "1.5rem",
            fontSize: "0.85rem"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "1.5rem" }}>
            <input 
              type="password" 
              placeholder="كلمة المرور" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              disabled={loading}
              autoFocus
              style={{ textAlign: "center" }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : "دخول"}
          </button>
        </form>

        <a href="/register" style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: "0.5rem", 
          marginTop: "1.5rem", 
          fontSize: "0.85rem", 
          color: "var(--muted)" 
        }}>
          <ArrowLeft size={14} /> العودة لصفحة التسجيل
        </a>
      </div>
    </main>
  );
}
