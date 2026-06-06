"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/admin-store";
import type { Product } from "@/lib/data/products";
import {
  LogOut, Plus, Pencil, Trash2, Eye, EyeOff,
  X, Search, RotateCcw, Package, TrendingUp,
  Star, AlertCircle, ChevronLeft, ChevronRight,
  ShoppingBag, Sparkles, Check, ImageIcon,
  Tag, Layers, Info,
} from "lucide-react";

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "crochet-bouquets", "crochet-flowers", "tulips", "roses", "sunflowers",
  "lavender-collections", "hair-clips", "crochet-bags", "keychains",
  "gift-hampers", "custom-orders", "seasonal-collections",
];

const OCCASIONS = [
  "birthday", "anniversary", "friendship", "valentine",
  "graduation", "mothers-day", "surprise",
];

const PAGE_SIZE = 8;

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function blankProduct(): Product {
  return {
    id: String(Date.now()),
    name: "", slug: "", description: "", shortDescription: "",
    price: 0, originalPrice: undefined,
    category: "crochet-bouquets", occasion: [], images: [],
    colors: [], rating: 5, reviewCount: 0,
    inStock: true, isNew: false, isBestseller: false,
    isTrending: false, isFeatured: false, customizable: true, tags: [],
  };
}

// ─── Design tokens / helpers ──────────────────────────────────────────────────

const inputCls = `w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200 placeholder:text-white/20`
  + ` bg-white/[0.04] border border-white/[0.08] focus:border-violet-500/60 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]`;

const selectCls = inputCls + " cursor-pointer";

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl p-5 flex items-start gap-4 relative overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "22" }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-white/40 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color: "violet" | "rose" | "amber" | "emerald" | "sky" | "red" }) {
  const map = {
    violet: "bg-violet-500/15 text-violet-300 border-violet-500/25",
    rose:   "bg-rose-500/15 text-rose-300 border-rose-500/25",
    amber:  "bg-amber-500/15 text-amber-300 border-amber-500/25",
    emerald:"bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    sky:    "bg-sky-500/15 text-sky-300 border-sky-500/25",
    red:    "bg-red-500/15 text-red-300 border-red-500/25",
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[color]}`}>
      {children}
    </span>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

// ─── Toggle chip ──────────────────────────────────────────────────────────────

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-150 ${
        active
          ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
          : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/60"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full transition-colors ${active ? "bg-violet-400" : "bg-white/20"}`} />
      {label}
    </button>
  );
}

// ─── Tag input ────────────────────────────────────────────────────────────────

function TagInput({ items, onAdd, onRemove, placeholder }: {
  items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void; placeholder: string;
}) {
  const [val, setVal] = useState("");
  const add = () => { if (val.trim()) { onAdd(val.trim()); setVal(""); } };
  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-1 text-xs bg-white/[0.06] border border-white/[0.08] text-white/60 px-2.5 py-1 rounded-full">
              {item}
              <button type="button" onClick={() => onRemove(i)} className="text-white/30 hover:text-white/60">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input type="text" value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          className={`${inputCls} flex-1`} placeholder={placeholder} />
        <button type="button" onClick={add}
          className="px-3 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Product Modal ────────────────────────────────────────────────────────────

function ProductModal({ initial, onSave, onClose }: {
  initial?: Product; onSave: (p: Product) => void; onClose: () => void;
}) {
  const isNew = !initial?.id || initial.id === blankProduct().id;
  const [form, setForm] = useState<Product>(initial ?? blankProduct());
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"basic" | "media" | "flags">("basic");

  const set = (key: keyof Product, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Product name is required"); return; }
    if (!form.price || form.price <= 0) { setError("Price must be greater than 0"); return; }
    onSave({ ...form, slug: form.slug || slugify(form.name) });
  };

  const toggleOccasion = (occ: string) =>
    set("occasion", form.occasion.includes(occ)
      ? form.occasion.filter((o) => o !== occ)
      : [...form.occasion, occ]);

  const tabs = [
    { id: "basic", label: "Basic Info", icon: <Info className="w-3.5 h-3.5" /> },
    { id: "media", label: "Media & Tags", icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: "flags", label: "Flags", icon: <Tag className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
      <div className="relative w-full max-w-2xl my-8 rounded-2xl overflow-hidden"
        style={{ background: "#13111a", border: "1px solid rgba(255,255,255,0.08)" }}>

        {/* Top accent */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.8), rgba(219,39,119,0.6), transparent)" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-bold text-white">{isNew ? "Add New Product" : "Edit Product"}</h2>
            <p className="text-xs text-white/40 mt-0.5">{isNew ? "Fill in the details to add a new product" : `Editing: ${form.name}`}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.06] px-6">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all -mb-px ${
                tab === t.id
                  ? "border-violet-500 text-violet-300"
                  : "border-transparent text-white/40 hover:text-white/60"
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 min-h-[360px]">
            {error && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs text-rose-300"
                style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
              </div>
            )}

            {/* Basic Info tab */}
            {tab === "basic" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Product Name *">
                    <input type="text" required value={form.name}
                      onChange={(e) => { set("name", e.target.value); set("slug", slugify(e.target.value)); }}
                      className={inputCls} placeholder="Rose Bouquet — Classic Red" />
                  </Field>
                  <Field label="URL Slug">
                    <input type="text" value={form.slug}
                      onChange={(e) => set("slug", slugify(e.target.value))}
                      className={inputCls} placeholder="auto-generated" />
                  </Field>
                </div>
                <Field label="Short Description">
                  <input type="text" value={form.shortDescription}
                    onChange={(e) => set("shortDescription", e.target.value)}
                    className={inputCls} placeholder="12 handmade crochet red roses…" />
                </Field>
                <Field label="Full Description">
                  <textarea value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    className={`${inputCls} h-28 resize-none`} placeholder="Detailed product description…" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Price (₹) *">
                    <input type="number" required min={1} value={form.price || ""}
                      onChange={(e) => set("price", Number(e.target.value))}
                      className={inputCls} placeholder="1499" />
                  </Field>
                  <Field label="Original Price (₹)">
                    <input type="number" min={0} value={form.originalPrice ?? ""}
                      onChange={(e) => set("originalPrice", e.target.value ? Number(e.target.value) : undefined)}
                      className={inputCls} placeholder="1999 (strikethrough)" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Category *">
                    <select value={form.category}
                      onChange={(e) => set("category", e.target.value)}
                      className={selectCls}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Rating (1–5)">
                    <input type="number" min={1} max={5} step={0.1} value={form.rating}
                      onChange={(e) => set("rating", Number(e.target.value))}
                      className={inputCls} />
                  </Field>
                </div>
                <Field label="Occasions">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {OCCASIONS.map((occ) => (
                      <ToggleChip key={occ} label={occ} active={form.occasion.includes(occ)} onClick={() => toggleOccasion(occ)} />
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {/* Media & Tags tab */}
            {tab === "media" && (
              <div className="space-y-5">
                <Field label="Image URLs">
                  <TagInput
                    items={form.images}
                    onAdd={(v) => set("images", [...form.images, v])}
                    onRemove={(i) => set("images", form.images.filter((_, j) => j !== i))}
                    placeholder="Paste image URL…"
                  />
                </Field>
                <Field label="Colors">
                  <TagInput
                    items={form.colors}
                    onAdd={(v) => set("colors", [...form.colors, v])}
                    onRemove={(i) => set("colors", form.colors.filter((_, j) => j !== i))}
                    placeholder="Red, Pink… (Enter to add)"
                  />
                </Field>
                <Field label="Tags">
                  <TagInput
                    items={form.tags}
                    onAdd={(v) => set("tags", [...form.tags, v.toLowerCase()])}
                    onRemove={(i) => set("tags", form.tags.filter((_, j) => j !== i))}
                    placeholder="roses, bouquet… (Enter to add)"
                  />
                </Field>
              </div>
            )}

            {/* Flags tab */}
            {tab === "flags" && (
              <div className="space-y-4">
                <p className="text-xs text-white/40">Toggle product flags and visibility settings.</p>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["inStock", "In Stock", "emerald"],
                      ["isNew", "New Arrival", "sky"],
                      ["isBestseller", "Bestseller", "amber"],
                      ["isTrending", "Trending", "violet"],
                      ["isFeatured", "Featured", "rose"],
                      ["customizable", "Customizable", "emerald"],
                    ] as [keyof Product, string, string][]
                  ).map(([key, label, color]) => (
                    <button key={key} type="button"
                      onClick={() => set(key, !form[key])}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all duration-150 ${
                        form[key]
                          ? `bg-${color}-500/10 border-${color}-500/30 text-${color}-300`
                          : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60"
                      }`}
                      style={form[key] ? {
                        background: `rgba(${color === "emerald" ? "16,185,129" : color === "sky" ? "14,165,233" : color === "amber" ? "245,158,11" : color === "violet" ? "139,92,246" : "244,63,94"},0.1)`,
                        borderColor: `rgba(${color === "emerald" ? "16,185,129" : color === "sky" ? "14,165,233" : color === "amber" ? "245,158,11" : color === "violet" ? "139,92,246" : "244,63,94"},0.3)`,
                        color: `rgb(${color === "emerald" ? "110,231,183" : color === "sky" ? "125,211,252" : color === "amber" ? "252,211,77" : color === "violet" ? "196,181,253" : "253,164,175"})`,
                      } : {}}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${form[key] ? "bg-current" : "border border-white/20"}`}>
                        {form[key] && <Check className="w-2.5 h-2.5 text-[#0D0D12]" />}
                      </div>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-5 border-t border-white/[0.06]"
            style={{ background: "rgba(0,0,0,0.2)" }}>
            <div className="flex gap-2">
              {tabs.map((t) => (
                <span key={t.id} className={`w-1.5 h-1.5 rounded-full transition-all ${tab === t.id ? "bg-violet-400" : "bg-white/15"}`} />
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                Cancel
              </button>
              <button type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}>
                {isNew ? "Add Product" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Change Password Modal ─────────────────────────────────────────────────────

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { setMsg({ ok: false, text: "Passwords do not match." }); return; }
    if (next.length < 6) { setMsg({ ok: false, text: "Must be at least 6 characters." }); return; }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (res.ok) {
        setMsg({ ok: true, text: "Password updated successfully!" });
        setTimeout(onClose, 1500);
      } else {
        const data = await res.json();
        setMsg({ ok: false, text: data.error || "Failed to update password." });
      }
    } catch {
      setMsg({ ok: false, text: "Failed to update password." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "#13111a", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.8), transparent)" }} />
        <div className="px-6 py-5 flex items-center justify-between border-b border-white/[0.06]">
          <h2 className="font-bold text-white">Change Password</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {msg && (
            <div className={`rounded-xl px-4 py-3 text-xs border flex items-center gap-2 ${msg.ok
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/25 text-rose-300"}`}>
              {msg.ok ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              {msg.text}
            </div>
          )}
          {[
            { label: "Current Password", val: current, set: setCurrent },
            { label: "New Password", val: next, set: setNext },
            { label: "Confirm New Password", val: confirm, set: setConfirm },
          ].map(({ label, val, set }) => (
            <Field key={label} label={label}>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={val} required
                  onChange={(e) => set(e.target.value)} className={`${inputCls} pr-10`} />
                <button type="button" onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </Field>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const { isLoggedIn, products, resetToDefaults } = useAdminStore();

  const [modal, setModal] = useState<"add" | "edit" | "password" | null>(null);
  const [editing, setEditing] = useState<Product | undefined>();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterFlag, setFilterFlag] = useState<"all" | "featured" | "new" | "bestseller" | "out-of-stock">("all");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Auth checking
  useEffect(() => {
    fetch("/api/auth/status")
      .then((res) => {
        if (res.ok) {
          useAdminStore.setState({ isLoggedIn: true });
        } else {
          useAdminStore.setState({ isLoggedIn: false });
          router.replace("/admin");
        }
      })
      .catch(() => {
        useAdminStore.setState({ isLoggedIn: false });
        router.replace("/admin");
      });
  }, [router]);

  // Load products from DB on mount
  const refreshProductsList = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        useAdminStore.setState({ products: data });
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  }, []);

  useEffect(() => {
    refreshProductsList();
  }, [refreshProductsList]);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.slug.includes(q) || p.tags.some((t) => t.includes(q));
    const matchCat = filterCat === "all" || p.category === filterCat;
    const matchFlag =
      filterFlag === "all" ? true :
      filterFlag === "featured" ? p.isFeatured :
      filterFlag === "new" ? p.isNew :
      filterFlag === "bestseller" ? p.isBestseller :
      !p.inStock;
    return matchSearch && matchCat && matchFlag;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filterCat, filterFlag]);

  const handleSave = async (product: Product) => {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/products/${product.id}` : "/api/products";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (res.ok) {
        const saved = await res.json();
        if (editing) {
          useAdminStore.setState({
            products: products.map((p) => (p.id === product.id ? saved : p)),
          });
          showToast("Product updated successfully");
        } else {
          useAdminStore.setState({
            products: [...products, saved],
          });
          showToast("Product added successfully");
        }
        setModal(null);
        setEditing(undefined);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save product");
      }
    } catch {
      alert("Failed to save product");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      try {
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (res.ok) {
          useAdminStore.setState({
            products: products.filter((p) => p.id !== id),
          });
          showToast("Product deleted", false);
        } else {
          alert("Failed to delete product");
        }
      } catch {
        alert("Failed to delete product");
      }
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    useAdminStore.setState({ isLoggedIn: false });
    router.replace("/admin");
  };

  if (!isLoggedIn) return null;

  // Stats
  const totalValue = products.reduce((s, p) => s + p.price, 0);
  const featuredCount = products.filter((p) => p.isFeatured).length;
  const outOfStock = products.filter((p) => !p.inStock).length;

  return (
    <div className="min-h-screen flex bg-[#0D0D12]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-rose-500/8 blur-[120px]" />
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-2xl transition-all`}
          style={{
            background: toast.ok ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)",
            border: `1px solid ${toast.ok ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)"}`,
            color: toast.ok ? "rgb(110,231,183)" : "rgb(253,164,175)",
            backdropFilter: "blur(12px)",
          }}>
          {toast.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Modals ── */}
      {(modal === "add" || modal === "edit") && (
        <ProductModal
          initial={modal === "edit" ? editing : undefined}
          onSave={handleSave}
          onClose={() => { setModal(null); setEditing(undefined); }}
        />
      )}
      {modal === "password" && <ChangePasswordModal onClose={() => setModal(null)} />}

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 relative z-10 border-r border-white/[0.06]"
        style={{ background: "rgba(13,13,18,0.9)", backdropFilter: "blur(24px)" }}>
        
        {/* Brand */}
        <div className="px-5 py-6 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Crochett & Co</p>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          <p className="text-[10px] text-white/20 uppercase tracking-widest px-3 py-2 mt-2">Catalogue</p>

          <NavItem icon={<Package />} label="Products" active />
          <NavItem icon={<Layers />} label="Categories" disabled />
          <NavItem icon={<ShoppingBag />} label="Orders" disabled />
          <NavItem icon={<TrendingUp />} label="Analytics" disabled />
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-white/[0.05] space-y-0.5">
          <button onClick={() => setModal("password")}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.05] transition-all">
            <Eye className="w-4 h-4 shrink-0" />
            Change Password
          </button>
          <button
            onClick={() => { if (confirm("Reset all products to defaults?")) { resetToDefaults(); showToast("Reset to defaults"); } }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-amber-400 hover:bg-amber-400/[0.05] transition-all">
            <RotateCcw className="w-4 h-4 shrink-0" />
            Reset Defaults
          </button>
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-rose-400/60 hover:text-rose-300 hover:bg-rose-400/[0.07] transition-all">
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]"
          style={{ background: "rgba(13,13,18,0.8)", backdropFilter: "blur(16px)" }}>
          <div>
            <h1 className="text-xl font-bold text-white">Products</h1>
            <p className="text-xs text-white/30 mt-0.5">{products.length} total products</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile sign out */}
            <button onClick={handleSignOut}
              className="md:hidden p-2 rounded-xl text-rose-400/60 hover:text-rose-400 hover:bg-rose-400/10 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setEditing(undefined); setModal("add"); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)", boxShadow: "0 4px 20px rgba(124,58,237,0.25)" }}>
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Products" value={products.length} icon={<Package className="w-5 h-5" />} color="#7c3aed" />
            <StatCard label="Featured" value={featuredCount} icon={<Star className="w-5 h-5" />} color="#f59e0b" />
            <StatCard label="Out of Stock" value={outOfStock} icon={<AlertCircle className="w-5 h-5" />} color="#f43f5e" />
            <StatCard label="Total Value" value={`₹${(totalValue / 1000).toFixed(0)}k`} icon={<TrendingUp className="w-5 h-5" />} color="#10b981" />
          </div>

          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, tags…"
                className={`${inputCls} pl-10`} />
            </div>
            {/* Category */}
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
              className={`${selectCls} sm:w-52`}>
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {/* Flag filter */}
            <select value={filterFlag} onChange={(e) => setFilterFlag(e.target.value as typeof filterFlag)}
              className={`${selectCls} sm:w-44`}>
              <option value="all">All Products</option>
              <option value="featured">Featured</option>
              <option value="new">New</option>
              <option value="bestseller">Bestseller</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/30"
              style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span>Product</span>
              <span>Category</span>
              <span>Price</span>
              <span>Actions</span>
            </div>

            {/* Rows */}
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center"
                style={{ background: "rgba(255,255,255,0.01)" }}>
                <Package className="w-10 h-10 text-white/10 mb-3" />
                <p className="text-sm text-white/30">No products found</p>
                <p className="text-xs text-white/20 mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              paginated.map((product, i) => (
                <div key={product.id}
                  className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center group transition-all duration-150 hover:bg-white/[0.025]"
                  style={{ borderBottom: i < paginated.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>

                  {/* Product info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-base overflow-hidden"
                      style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}>
                      {product.images[0]
                        ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        : "🌸"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{product.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {product.isBestseller && <Badge color="amber">Bestseller</Badge>}
                        {product.isFeatured && <Badge color="violet">Featured</Badge>}
                        {product.isNew && <Badge color="sky">New</Badge>}
                        {product.isTrending && <Badge color="rose">Trending</Badge>}
                        {!product.inStock && <Badge color="red">Out of Stock</Badge>}
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="min-w-0">
                    <p className="text-xs text-white/40 truncate">{product.category}</p>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-sm font-semibold text-white">₹{product.price.toLocaleString()}</p>
                    {product.originalPrice && (
                      <p className="text-xs text-white/25 line-through">₹{product.originalPrice.toLocaleString()}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditing(product); setModal("edit"); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-violet-300 hover:bg-violet-500/10 transition-all"
                      title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                      title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/30">
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white disabled:opacity-25 transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
                    style={p === page
                      ? { background: "linear-gradient(135deg, #7c3aed, #db2777)", color: "white" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white disabled:opacity-25 transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Info footer */}
          <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 text-xs text-amber-300/60"
            style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)" }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400/50" />
            <p>Changes are saved securely in the database and reflected immediately on all store pages.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({ icon, label, active, disabled }: {
  icon: React.ReactNode; label: string; active?: boolean; disabled?: boolean;
}) {
  return (
    <button disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
        disabled ? "opacity-25 cursor-not-allowed text-white/40"
          : active
            ? "text-violet-300 font-medium"
            : "text-white/40 hover:text-white hover:bg-white/[0.04]"
      }`}
      style={active ? { background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" } : {}}>
      <span className="w-4 h-4 shrink-0">{icon}</span>
      {label}
    </button>
  );
}
