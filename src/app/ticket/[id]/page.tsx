"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { User, Hash, Activity, XCircle, ArrowRight, Loader2 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  WAITING: "في الانتظار",
  CALLED: "يتم خدمتك الآن",
  DONE: "تمت الخدمة",
  CANCELLED: "تم الإلغاء",
  SKIPPED: "تم التخطي",
};

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
    } catch (err) {
      alert("حدث خطأ");
    } finally {
      setCancelling(false);
    }
  };

  if (loading)
    return (
      <div className="container text-center" style={{ paddingTop: "5rem" }}>
        <Loader2 className="animate-spin" size={40} />
      </div>
    );

  if (!item)
    return (
      <div className="container text-center">
        <h1>الرقم غير موجود</h1>
        <button className="btn btn-outline" onClick={() => router.push("/")}>
          العودة للتسجيل
        </button>
      </div>
    );

  return (
    <main className="container animate-fade">
      <div className="text-center" style={{ marginBottom: "2rem" }}>
        <h1 className="h1">تذكرتك الرقمية</h1>
      </div>

      <div className="card text-center" style={{ padding: "3rem 1.5rem" }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>{item.name}</div>
        <div style={{ fontSize: "5rem", fontWeight: 900, color: "var(--accent)", lineHeight: 1 }}>{item.queueNumber}</div>
        <div
          className={`badge badge-${item.status.toLowerCase()}`}
          style={{
            marginTop: "1.5rem",
            padding: "0.5rem 1.5rem",
            fontSize: "1rem",
            background: item.status === "CALLED" ? "var(--success)" : undefined,
          }}
        >
          {STATUS_LABELS[item.status]}
        </div>
      </div>

      <div
        className="card"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div>
          <div className="label">يتم خدمته الآن</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{item.nowServing}</div>
        </div>
        <div style={{ borderRight: "1px solid var(--card-border)" }}>
          <div className="label">موقع الفرع</div>
          <div style={{ fontSize: "1.1rem" }}>المكتب الرئيسي</div>
        </div>
      </div>

      {["WAITING", "CALLED"].includes(item.status) && (
        <button
          className="btn btn-danger"
          style={{ width: "100%", marginBottom: "1rem" }}
          onClick={handleCancel}
          disabled={cancelling}
        >
          <XCircle size={18} /> إلغاء الدور
        </button>
      )}

      <button className="btn btn-outline" style={{ width: "100%" }} onClick={() => router.push("/")}>
        <ArrowRight size={18} /> العودة للرئيسية
      </button>

      <div
        style={{
          marginTop: "2rem",
          fontSize: "0.8rem",
          color: "var(--muted)",
          textAlign: "center",
        }}
      >
        التحديث يتم تلقائياً كل 5 ثوانٍ
      </div>
    </main>
  );
}
