"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/admin-store";
import type { Product } from "@/lib/data/products";
import type { Category } from "@/lib/data/categories";
import type { Order, OrderItem, OrderStatus } from "@/lib/data/orders";
import {
  LogOut, Plus, Pencil, Trash2, Eye, EyeOff,
  X, Search, RotateCcw, Package, TrendingUp,
  Star, AlertCircle, ChevronLeft, ChevronRight,
  ShoppingBag, Sparkles, Check, ImageIcon,
  Tag, Layers, Info, Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

function blankCategory(): Category {
  return {
    id: String(Date.now()),
    name: "", slug: "", description: "",
    icon: "💐", productCount: 0,
    gradient: "from-rose-pink/20 to-lavender/20",
  };
}

// ─── Design tokens / helpers ──────────────────────────────────────────────────

const inputCls = `w-full rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none transition-all duration-200 placeholder:text-foreground/30`
  + ` bg-white border border-border focus:border-[var(--color-rose-pink)] focus:shadow-[0_0_15px_rgba(242,138,174,0.15)]`;

const selectCls = inputCls + " cursor-pointer";

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -4 }}
      className="glass rounded-2xl p-5 flex items-start gap-4 relative overflow-hidden transition-shadow duration-300 border border-border shadow-sm hover:shadow-md"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "15" }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
      <div className="absolute right-0 bottom-0 w-24 h-24 rounded-full blur-[40px] opacity-10 pointer-events-none" style={{ background: color }} />
    </motion.div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color: "violet" | "rose" | "amber" | "emerald" | "sky" | "red" }) {
  const map = {
    violet: "bg-[var(--color-lavender)]/10 text-purple-700 border-[var(--color-lavender)]/20",
    rose:   "bg-[var(--color-rose-pink)]/10 text-[var(--color-rose-pink)] border-[var(--color-rose-pink)]/20",
    amber:  "bg-amber-50 text-amber-800 border-amber-200/60",
    emerald:"bg-emerald-50 text-emerald-800 border-emerald-200/60",
    sky:    "bg-sky-50 text-sky-800 border-sky-200/60",
    red:    "bg-red-50 text-red-800 border-red-200/60",
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
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

// ─── Toggle chip ──────────────────────────────────────────────────────────────

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-150 cursor-pointer ${
        active
          ? "bg-[var(--color-rose-pink)]/10 border-[var(--color-rose-pink)]/30 text-[var(--color-rose-pink)]"
          : "bg-muted/20 border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full transition-colors ${active ? "bg-[var(--color-rose-pink)]" : "bg-foreground/20"}`} />
      {label}
    </button>
  );
}

// ─── Custom switch for flags ──────────────────────────────────────────────────

function CustomSwitch({ active, label, color, onChange }: { active: boolean; label: string; color: string; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-center justify-between w-full p-3.5 rounded-xl border transition-all bg-white border border-border hover:bg-muted/10 cursor-pointer"
    >
      <span className="text-sm font-medium text-foreground/80">{label}</span>
      <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${active ? color : 'bg-muted'}`}>
        <motion.div
          layout
          className="w-5 h-5 rounded-full bg-white shadow-md"
          animate={{ x: active ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
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
            <span key={i} className="flex items-center gap-1.5 text-xs bg-muted/30 border border-border text-foreground px-2.5 py-1 rounded-full">
              {item}
              <button type="button" onClick={() => onRemove(i)} className="text-foreground/30 hover:text-foreground/60 cursor-pointer">
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
          className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground/70 hover:text-foreground transition-colors bg-white border border-border cursor-pointer">
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Product Modal ────────────────────────────────────────────────────────────

function ProductModal({ initial, categories, onSave, onClose }: {
  initial?: Product; categories: Category[]; onSave: (p: Product) => void; onClose: () => void;
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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-2xl my-8 rounded-2xl overflow-hidden glass shadow-2xl border border-border"
      >
        {/* Top accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--color-rose-pink)] to-[var(--color-lavender)]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">{isNew ? "Add New Product" : "Edit Product"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{isNew ? "Fill in the details to add a new product" : `Editing: ${form.name}`}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/30 hover:text-foreground hover:bg-rose-100/30 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold transition-all -mb-px cursor-pointer ${
                tab === t.id
                  ? "text-[var(--color-rose-pink)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              {t.icon}{t.label}
              {tab === t.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-rose-pink)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 min-h-[360px]">
            {error && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
              </div>
            )}

            {/* Basic Info tab */}
            {tab === "basic" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Category *">
                    <select value={form.category}
                      onChange={(e) => set("category", e.target.value)}
                      className={selectCls}>
                      {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
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

            {tab === "flags" && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">Toggle product flags and visibility settings.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    ["inStock", "In Stock", "bg-emerald-500"],
                    ["isNew", "New Arrival", "bg-sky-500"],
                    ["isBestseller", "Bestseller", "bg-amber-500"],
                    ["isTrending", "Trending", "bg-[var(--color-rose-pink)]"],
                    ["isFeatured", "Featured", "bg-[var(--color-lavender)]"],
                    ["customizable", "Customizable", "bg-emerald-500"],
                  ].map(([key, label, color]) => (
                    <CustomSwitch 
                       key={key} 
                       active={Boolean(form[key as keyof Product])} 
                       label={label} 
                       color={color} 
                       onChange={() => set(key as keyof Product, !form[key as keyof Product])} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-5 border-t border-border bg-muted/10">
            <div className="flex gap-2">
              {tabs.map((t) => (
                <span key={t.id} className={`w-1.5 h-1.5 rounded-full transition-all ${tab === t.id ? "bg-[var(--color-rose-pink)]" : "bg-foreground/15"}`} />
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground transition-all bg-white border border-border cursor-pointer">
                Cancel
              </button>
              <button type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-foreground transition-all bg-gradient-to-r from-[var(--color-rose-pink)] to-[var(--color-lavender)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                {isNew ? "Add Product" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Category Modal ───────────────────────────────────────────────────────────

function CategoryModal({ initial, onSave, onClose }: {
  initial?: Category; onSave: (c: Category) => void; onClose: () => void;
}) {
  const isNew = !initial?.id || initial.id === blankCategory().id;
  const [form, setForm] = useState<Category>(initial ?? blankCategory());
  const [error, setError] = useState("");

  const set = (key: keyof Category, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Category name is required"); return; }
    onSave({ ...form, slug: form.slug || slugify(form.name) });
  };

  const gradientOptions = [
    "from-rose-pink/20 to-lavender/20",
    "from-rose-pink/20 to-sunflower/20",
    "from-rose-pink/30 to-cream/30",
    "from-rose-pink-dark/20 to-rose-pink/20",
    "from-sunflower/20 to-sunflower-light/20",
    "from-lavender/20 to-lavender-light/20",
    "from-sage/20 to-cream/20",
    "from-sunflower/20 to-rose-pink/20",
    "from-lavender/20 to-rose-pink/20",
    "from-sunflower/20 to-sage/20",
    "from-sunflower-dark/20 to-sage/20",
  ];

  const quickEmojis = ["💐", "🌸", "🌷", "🌹", "🌻", "🔑", "🎁", "🎀", "👜", "💜", "✨", "🍂"];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-lg my-8 rounded-2xl overflow-hidden glass shadow-2xl border border-border"
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--color-rose-pink)] to-[var(--color-lavender)]" />

        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">{isNew ? "Add New Category" : "Edit Category"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{isNew ? "Create a new category for your products" : `Editing: ${form.name}`}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/30 hover:text-foreground hover:bg-rose-100/30 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Category Name *">
                <input type="text" required value={form.name}
                  onChange={(e) => { set("name", e.target.value); set("slug", slugify(e.target.value)); }}
                  className={inputCls} placeholder="💐 Bouquet Special" />
              </Field>
              <Field label="URL Slug">
                <input type="text" value={form.slug}
                  onChange={(e) => set("slug", slugify(e.target.value))}
                  className={inputCls} placeholder="auto-generated" />
              </Field>
            </div>

            <Field label="Icon / Emoji *">
              <div className="space-y-2">
                <input type="text" required value={form.icon}
                  onChange={(e) => set("icon", e.target.value)}
                  className={`${inputCls} text-lg w-20 text-center`} placeholder="💐" />
                <div className="flex flex-wrap gap-1.5">
                  {quickEmojis.map((emoji) => (
                    <button key={emoji} type="button" onClick={() => set("icon", emoji)}
                      className="w-8 h-8 rounded-lg border border-border bg-white flex items-center justify-center hover:bg-muted/20 text-sm transition-colors cursor-pointer">
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </Field>

            <Field label="Gradient Background Preset *">
              <select value={form.gradient} onChange={(e) => set("gradient", e.target.value)} className={selectCls}>
                {gradientOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </Field>

            <Field label="Description">
              <textarea value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className={`${inputCls} h-24 resize-none`} placeholder="Describe this category..." />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-border bg-muted/10">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground transition-all bg-white border border-border cursor-pointer">
              Cancel
            </button>
            <button type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-foreground transition-all bg-gradient-to-r from-[var(--color-rose-pink)] to-[var(--color-lavender)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
              {isNew ? "Add Category" : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md rounded-2xl overflow-hidden glass shadow-2xl border border-border"
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--color-rose-pink)] to-transparent" />
        <div className="px-6 py-5 flex items-center justify-between border-b border-border">
          <h2 className="font-bold text-foreground">Change Password</h2>
          <button onClick={onClose} className="text-foreground/30 hover:text-foreground transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {msg && (
            <div className={`rounded-xl px-4 py-3 text-xs border flex items-center gap-2 ${msg.ok
              ? "bg-emerald-50 border-emerald-200/60 text-emerald-800"
              : "bg-rose-50 border-rose-200/60 text-rose-800"}`}>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/25 hover:text-[var(--color-rose-pink)] transition-colors cursor-pointer">
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </Field>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground transition-all bg-white border border-border cursor-pointer">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-foreground bg-gradient-to-r from-[var(--color-rose-pink)] to-[var(--color-lavender)] hover:shadow-[0_0_15px_rgba(242,138,174,0.2)] cursor-pointer">
              Update Password
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const { isLoggedIn, products, categories, resetToDefaults } = useAdminStore();

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders' | 'analytics'>('products');
  const [orders, setOrders] = useState<Order[]>([]);

  const [modal, setModal] = useState<"add" | "edit" | "password" | null>(null);
  const [editing, setEditing] = useState<Product | undefined>();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterFlag, setFilterFlag] = useState<"all" | "featured" | "new" | "bestseller" | "out-of-stock">("all");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Categories & Orders specific states
  const [categoryModal, setCategoryModal] = useState<"add" | "edit" | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [categorySearch, setCategorySearch] = useState("");

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'shipped' | 'completed' | 'cancelled'>('all');

  // Chart interactivity states
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

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

  const refreshCategoriesList = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        useAdminStore.setState({ categories: data });
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  const refreshOrdersList = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    }
  }, []);

  useEffect(() => {
    refreshProductsList();
    refreshCategoriesList();
    refreshOrdersList();
  }, [refreshProductsList, refreshCategoriesList, refreshOrdersList]);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Products filtering & pagination
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

  // Categories CRUD Handlers
  const handleSaveCategory = async (category: Category) => {
    const method = editingCategory ? "PUT" : "POST";
    const url = editingCategory ? `/api/categories/${category.id}` : "/api/categories";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      });
      if (res.ok) {
        showToast(editingCategory ? "Category updated successfully" : "Category added successfully");
        refreshCategoriesList();
        setCategoryModal(null);
        setEditingCategory(undefined);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save category");
      }
    } catch {
      alert("Failed to save category");
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (confirm(`Delete category "${name}"? This cannot be undone.`)) {
      try {
        const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
        if (res.ok) {
          showToast("Category deleted", false);
          refreshCategoriesList();
        } else {
          const data = await res.json();
          alert(data.error || "Failed to delete category");
        }
      } catch {
        alert("Failed to delete category");
      }
    }
  };

  // Orders CRUD Handlers
  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showToast("Order status updated successfully");
        refreshOrdersList();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update order status");
      }
    } catch {
      alert("Failed to update order status");
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (confirm(`Delete order "${id}"? This cannot be undone.`)) {
      try {
        const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
        if (res.ok) {
          showToast("Order deleted", false);
          refreshOrdersList();
        } else {
          const data = await res.json();
          alert(data.error || "Failed to delete order");
        }
      } catch {
        alert("Failed to delete order");
      }
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    useAdminStore.setState({ isLoggedIn: false });
    router.replace("/admin");
  };

  if (!isLoggedIn) return null;

  // Stats for Products (used in product tab or overview)
  const totalValue = products.reduce((s, p) => s + p.price, 0);
  const featuredCount = products.filter((p) => p.isFeatured).length;
  const outOfStock = products.filter((p) => !p.inStock).length;

  // Analytics Computations
  const nonCancelledOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const aov = nonCancelledOrders.length > 0 ? totalRevenue / nonCancelledOrders.length : 0;
  const totalOrdersCount = orders.length;
  const uniqueEmails = new Set(orders.map(o => o.customerEmail)).size;

  // Monthly Sales Helper
  const getPastMonths = () => {
    const months = [];
    const date = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short' });
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ label, yearMonth });
    }
    return months;
  };
  const monthsData = getPastMonths().map(m => {
    const monthOrders = orders.filter(o => {
      return o.date.startsWith(m.yearMonth) && o.status !== 'cancelled';
    });
    const revenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return { label: m.label, revenue };
  });

  // Top Selling Categories Helper
  const categorySales: { [slug: string]: { name: string; amount: number; count: number } } = {};
  categories.forEach(c => {
    categorySales[c.slug] = { name: c.name, amount: 0, count: 0 };
  });
  orders.forEach(o => {
    if (o.status === 'cancelled') return;
    o.items.forEach(item => {
      const product = products.find(p => p.id === item.productId || p.slug === item.productId);
      const catSlug = product ? product.category : 'other';
      const catName = product ? (categories.find(c => c.slug === product.category)?.name || product.category) : 'Other';
      
      if (!categorySales[catSlug]) {
        categorySales[catSlug] = { name: catName, amount: 0, count: 0 };
      }
      categorySales[catSlug].amount += item.price * item.quantity;
      categorySales[catSlug].count += item.quantity;
    });
  });
  const topCategories = Object.entries(categorySales)
    .map(([slug, data]) => ({ slug, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const maxCategoryAmount = Math.max(...topCategories.map(c => c.amount), 1);

  // Category list filter
  const filteredCategories = categories.filter((cat) => {
    const q = categorySearch.toLowerCase();
    return !q || cat.name.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q) || cat.slug.includes(q);
  });

  // Orders list filter
  const filteredOrders = orders.filter((o) => {
    const q = orderSearch.toLowerCase();
    const matchSearch = !q || o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerEmail.toLowerCase().includes(q) || o.customerPhone.toLowerCase().includes(q);
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    return matchSearch && matchStatus;
  });

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr from-[var(--color-rose-pink)] to-[var(--color-lavender)] shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground tracking-wide">Crochett & Co</p>
            <p className="text-[9px] text-[var(--color-rose-pink)] uppercase tracking-widest font-semibold">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-[10px] text-foreground/40 uppercase tracking-widest px-3 py-2">Catalogue</p>
        <NavItem icon={<Package />} label="Products" active={activeTab === 'products'} onClick={() => { setActiveTab('products'); setMobileMenuOpen(false); }} />
        <NavItem icon={<Layers />} label="Categories" active={activeTab === 'categories'} onClick={() => { setActiveTab('categories'); setMobileMenuOpen(false); }} />
        <NavItem icon={<ShoppingBag />} label="Orders" active={activeTab === 'orders'} onClick={() => { setActiveTab('orders'); setMobileMenuOpen(false); }} />
        <NavItem icon={<TrendingUp />} label="Analytics" active={activeTab === 'analytics'} onClick={() => { setActiveTab('analytics'); setMobileMenuOpen(false); }} />
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-border space-y-1">
        <button onClick={() => { setMobileMenuOpen(false); setModal("password"); }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-foreground/60 hover:text-foreground hover:bg-rose-100/30 transition-all cursor-pointer">
          <Eye className="w-4 h-4 shrink-0" />
          Change Password
        </button>
        <button
          onClick={() => { setMobileMenuOpen(false); if (confirm("Reset all products to defaults?")) { resetToDefaults(); showToast("Reset to defaults"); } }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-foreground/60 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer">
          <RotateCcw className="w-4 h-4 shrink-0" />
          Reset Defaults
        </button>
        <button onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600/80 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer">
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#FFF7F2]">
      {/* Background radial glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-[var(--color-rose-pink)]/5 blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[var(--color-lavender)]/4 blur-[130px]" />
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-[100] flex items-center gap-2.5 rounded-xl px-4 py-3.5 text-sm font-semibold shadow-2xl backdrop-blur-md border`}
            style={{
              background: toast.ok ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)",
              borderColor: toast.ok ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)",
              color: toast.ok ? "rgb(110,231,183)" : "rgb(253,164,175)",
            }}>
            {toast.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <AnimatePresence>
        {(modal === "add" || modal === "edit") && (
          <ProductModal
            initial={modal === "edit" ? editing : undefined}
            categories={categories}
            onSave={handleSave}
            onClose={() => { setModal(null); setEditing(undefined); }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(categoryModal === "add" || categoryModal === "edit") && (
          <CategoryModal
            initial={categoryModal === "edit" ? editingCategory : undefined}
            onSave={handleSaveCategory}
            onClose={() => { setCategoryModal(null); setEditingCategory(undefined); }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {modal === "password" && <ChangePasswordModal onClose={() => setModal(null)} />}
      </AnimatePresence>

      {/* ── Responsive Mobile Menu Drawer ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="fixed top-0 bottom-0 left-0 z-50 w-64 flex flex-col border-r border-border glass shadow-2xl md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 relative z-10 border-r border-border glass backdrop-blur-md">
        {sidebarContent}
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-[#FFF7F2]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 rounded-xl text-foreground/60 hover:text-foreground hover:bg-rose-100/30 transition-all cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-wide">
                {activeTab === 'products' && "Products"}
                {activeTab === 'categories' && "Categories"}
                {activeTab === 'orders' && "Orders"}
                {activeTab === 'analytics' && "Analytics"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeTab === 'products' && `${products.length} total products`}
                {activeTab === 'categories' && `${categories.length} total categories`}
                {activeTab === 'orders' && `${orders.length} total orders`}
                {activeTab === 'analytics' && "Business insights and performance"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile sign out icon button */}
            <button onClick={handleSignOut}
              className="md:hidden p-2.5 rounded-xl text-rose-600/80 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
              title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
            {activeTab === 'products' && (
              <button
                onClick={() => { setEditing(undefined); setModal("add"); }}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-bold text-foreground transition-all bg-gradient-to-r from-[var(--color-rose-pink)] to-[var(--color-lavender)] hover:shadow-[0_0_15px_rgba(242,138,174,0.25)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            )}
            {activeTab === 'categories' && (
              <button
                onClick={() => { setEditingCategory(undefined); setCategoryModal("add"); }}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-bold text-foreground transition-all bg-gradient-to-r from-[var(--color-rose-pink)] to-[var(--color-lavender)] hover:shadow-[0_0_15px_rgba(242,138,174,0.25)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            )}
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ─────────────────── PRODUCTS TAB ─────────────────── */}
          {activeTab === 'products' && (
            <>
              {/* Stat cards grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Products" value={products.length} icon={<Package className="w-5 h-5" />} color="var(--color-lavender)" />
                <StatCard label="Featured" value={featuredCount} icon={<Star className="w-5 h-5" />} color="var(--color-sunflower)" />
                <StatCard label="Out of Stock" value={outOfStock} icon={<AlertCircle className="w-5 h-5" />} color="var(--color-rose-pink)" />
                <StatCard label="Total Value" value={`₹${(totalValue / 1000).toFixed(0)}k`} icon={<TrendingUp className="w-5 h-5" />} color="var(--color-sage)" />
              </div>

              {/* Filters row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/35" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products, tags…"
                    className={`${inputCls} pl-10`} />
                </div>
                {/* Category */}
                <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
                  className={`${selectCls} sm:w-52`}>
                  <option value="all">All Categories</option>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
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

              {/* Table Container */}
              <div className="rounded-2xl overflow-hidden border border-border bg-white shadow-sm">
                {/* Table Header */}
                <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/30 border-b border-border">
                  <span>Product</span>
                  <span>Category</span>
                  <span>Price</span>
                  <span className="text-right">Actions</span>
                </div>

                {/* Rows / Cards */}
                {paginated.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-transparent">
                    <Package className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No products found</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {paginated.map((product) => {
                      const matchedCat = categories.find(c => c.slug === product.category);
                      return (
                        <div key={product.id}
                          className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-3 sm:gap-4 px-5 py-4.5 items-center group transition-all duration-200 hover:bg-muted/10">

                          {/* Product info */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-base overflow-hidden bg-muted/30 border border-border">
                              {product.images[0]
                                ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                : "🌸"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {product.isBestseller && <Badge color="amber">Bestseller</Badge>}
                                {product.isFeatured && <Badge color="violet">Featured</Badge>}
                                {product.isNew && <Badge color="sky">New</Badge>}
                                {product.isTrending && <Badge color="rose">Trending</Badge>}
                                {!product.inStock && <Badge color="red">Out of Stock</Badge>}
                              </div>
                            </div>
                          </div>

                          {/* Category */}
                          <div className="min-w-0 flex items-center sm:block">
                            <span className="sm:hidden text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-20 shrink-0">Category</span>
                            <p className="text-xs text-muted-foreground truncate bg-muted/20 sm:bg-transparent px-2.5 py-1 sm:px-0 sm:py-0 rounded-full border border-border sm:border-0 inline-block sm:block">
                              {matchedCat ? matchedCat.name : product.category}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="flex items-center sm:block">
                            <span className="sm:hidden text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-20 shrink-0">Price</span>
                            <div className="flex items-baseline gap-2">
                              <p className="text-sm font-bold text-foreground">₹{product.price.toLocaleString()}</p>
                              {product.originalPrice && (
                                <p className="text-xs text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</p>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t border-border sm:border-0">
                            <button
                              onClick={() => { setEditing(product); setModal("edit"); }}
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground/45 hover:text-[var(--color-rose-pink)] hover:bg-muted/40 hover:border-border border border-transparent transition-all cursor-pointer"
                              title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id, product.name)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground/45 hover:text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10 transition-all cursor-pointer"
                              title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground/70">
                    Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} products
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground/40 hover:text-foreground disabled:opacity-25 transition-all bg-white border border-border cursor-pointer">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setPage(p)}
                        className="w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        style={p === page
                          ? { backgroundColor: "var(--color-rose-pink)", color: "#FFFFFF" }
                          : { backgroundColor: "#FFFFFF", border: "1px solid #F0E4DB", color: "rgba(0,0,0,0.4)" }}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground/40 hover:text-foreground disabled:opacity-25 transition-all bg-white border border-border cursor-pointer">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─────────────────── CATEGORIES TAB ─────────────────── */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/35" />
                <input type="text" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Search categories by name, slug, description..."
                  className={`${inputCls} pl-10`} />
              </div>

              {/* Category list/grid */}
              {filteredCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-border">
                  <Layers className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No categories found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map((cat) => {
                    const prodCount = products.filter(p => p.category === cat.slug).length;
                    return (
                      <div key={cat.id} className={`bg-gradient-to-br ${cat.gradient} rounded-2xl p-5 border border-border/40 shadow-sm flex flex-col justify-between`}>
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-full bg-white/70 shadow-sm flex items-center justify-center text-2xl">
                              {cat.icon}
                            </div>
                            <span className="text-xs font-semibold bg-white/60 px-2.5 py-1 rounded-full border border-border/20 text-foreground/80">
                              {prodCount} {prodCount === 1 ? 'product' : 'products'}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-foreground mt-4">{cat.name}</h3>
                          <p className="text-xs text-muted-foreground/90 font-mono mt-0.5">/{cat.slug}</p>
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cat.description || "No description provided."}</p>
                        </div>
                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/30">
                          <button
                            onClick={() => { setEditingCategory(cat); setCategoryModal("edit"); }}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground/50 hover:text-[var(--color-rose-pink)] hover:bg-white/60 transition-all border border-transparent hover:border-border/40 cursor-pointer"
                            title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground/50 hover:text-rose-600 hover:bg-rose-50/60 transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                            title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─────────────────── ORDERS TAB ─────────────────── */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/35" />
                  <input type="text" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search orders by ID, customer name, email..."
                    className={`${inputCls} pl-10`} />
                </div>
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {(['all', 'pending', 'shipped', 'completed', 'cancelled'] as const).map((st) => (
                    <button key={st} onClick={() => setOrderStatusFilter(st)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        orderStatusFilter === st
                          ? "bg-[var(--color-rose-pink)] text-white border-[var(--color-rose-pink)]"
                          : "bg-white border-border text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table / List */}
              <div className="rounded-2xl overflow-hidden border border-border bg-white shadow-sm divide-y divide-border">
                {filteredOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No orders found</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div key={order.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/5 transition-colors">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-sm font-bold text-foreground">{order.id}</span>
                          <span className="text-xs text-muted-foreground">{new Date(order.date).toLocaleString()}</span>
                          <Badge color={
                            order.status === 'completed' ? 'emerald' :
                            order.status === 'shipped' ? 'sky' :
                            order.status === 'pending' ? 'amber' : 'red'
                          }>
                            {order.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p className="font-medium text-foreground">{order.customerName}</p>
                          <p>{order.customerEmail} • {order.customerPhone}</p>
                        </div>
                        <div className="pt-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Items</p>
                          <div className="flex flex-wrap gap-2">
                            {order.items.map((item, idx) => (
                              <span key={idx} className="bg-muted/30 border border-border text-foreground px-2 py-1 rounded-lg text-xs">
                                {item.productName} <span className="text-muted-foreground font-mono">x{item.quantity}</span> (₹{item.price})
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Amount</p>
                          <p className="text-lg font-black text-foreground">₹{order.totalAmount.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select value={order.status} onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className={`${selectCls} py-1.5 px-3 text-xs w-36`}>
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground/45 hover:text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10 transition-all cursor-pointer"
                            title="Delete Order">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ─────────────────── ANALYTICS TAB ─────────────────── */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Key KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} color="var(--color-sage)" />
                <StatCard label="Average Order Value" value={`₹${aov.toFixed(0)}`} icon={<ShoppingBag className="w-5 h-5" />} color="var(--color-lavender)" />
                <StatCard label="Total Orders" value={totalOrdersCount} icon={<Package className="w-5 h-5" />} color="var(--color-sunflower)" />
                <StatCard label="Active Customers" value={uniqueEmails} icon={<Star className="w-5 h-5" />} color="var(--color-rose-pink)" />
              </div>

              {/* Visual Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Sales & Revenue Bar Chart */}
                <div className="glass rounded-2xl p-5 border border-border shadow-sm bg-white space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Monthly Sales & Revenue</h3>
                  {(() => {
                    const maxRev = Math.max(...monthsData.map(m => m.revenue), 1000);
                    return (
                      <div className="relative">
                        <svg viewBox="0 0 400 220" className="w-full h-52">
                          <defs>
                            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--color-rose-pink)" />
                              <stop offset="100%" stopColor="var(--color-lavender)" stopOpacity={0.4} />
                            </linearGradient>
                          </defs>
                          {/* Grid lines */}
                          <line x1="40" y1="30" x2="380" y2="30" stroke="#F0E4DB" strokeDasharray="4 4" />
                          <line x1="40" y1="100" x2="380" y2="100" stroke="#F0E4DB" strokeDasharray="4 4" />
                          <line x1="40" y1="170" x2="380" y2="170" stroke="#F0E4DB" />
                          
                          {/* Y Axis Labels */}
                          <text x="32" y="34" className="text-[9px] text-muted-foreground/60 fill-current text-right" textAnchor="end">₹{(maxRev).toFixed(0)}</text>
                          <text x="32" y="104" className="text-[9px] text-muted-foreground/60 fill-current text-right" textAnchor="end">₹{(maxRev/2).toFixed(0)}</text>
                          <text x="32" y="174" className="text-[9px] text-muted-foreground/60 fill-current text-right" textAnchor="end">₹0</text>
                          
                          {/* Bars */}
                          {monthsData.map((m, idx) => {
                            const barHeight = m.revenue > 0 ? (m.revenue / maxRev) * 140 : 4;
                            const x = 55 + idx * 55;
                            const y = 170 - barHeight;
                            const isHovered = hoveredBar === idx;
                            return (
                              <g key={idx} onMouseEnter={() => setHoveredBar(idx)} onMouseLeave={() => setHoveredBar(null)} className="cursor-pointer">
                                <rect x={x} y={y} width="28" height={barHeight} rx="4" fill="url(#barGrad)"
                                  className="transition-all duration-200 hover:brightness-95" />
                                {isHovered && (
                                  <g>
                                    <rect x={x - 20} y={y - 25} width="68" height={20} rx="4" fill="#374151" />
                                    <text x={x + 14} y={y - 12} fill="#ffffff" className="text-[9px] font-bold fill-white" textAnchor="middle">
                                      ₹{m.revenue.toLocaleString()}
                                    </text>
                                  </g>
                                )}
                                <text x={x + 14} y="190" className="text-[10px] text-muted-foreground fill-current font-semibold" textAnchor="middle">{m.label}</text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}
                </div>

                {/* Top-Selling Categories Chart */}
                <div className="glass rounded-2xl p-5 border border-border shadow-sm bg-white space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Top-Selling Categories (by Revenue)</h3>
                  <div className="space-y-4">
                    {topCategories.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-12">No sales data recorded yet.</p>
                    ) : (
                      topCategories.map((cat) => {
                        const percentage = (cat.amount / maxCategoryAmount) * 100;
                        return (
                          <div key={cat.slug} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-foreground">{cat.name}</span>
                              <span className="text-muted-foreground">₹{cat.amount.toLocaleString()} ({cat.count} sold)</span>
                            </div>
                            <div className="w-full bg-muted/40 rounded-full h-3 overflow-hidden border border-border/45">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="bg-gradient-to-r from-[var(--color-rose-pink)] to-[var(--color-lavender)] h-full rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Donut Chart Status Breakdown */}
                <div className="glass rounded-2xl p-5 border border-border shadow-sm bg-white space-y-4 lg:col-span-2 flex flex-col items-center">
                  <h3 className="text-sm font-bold text-foreground self-start font-bold">Order Status Breakdown</h3>
                  {(() => {
                    const total = orders.length || 1;
                    const statusCounts = { pending: 0, shipped: 0, completed: 0, cancelled: 0 };
                    orders.forEach(o => {
                      if (statusCounts[o.status] !== undefined) {
                        statusCounts[o.status]++;
                      }
                    });
                    const completedPct = statusCounts.completed / total;
                    const shippedPct = statusCounts.shipped / total;
                    const pendingPct = statusCounts.pending / total;
                    const cancelledPct = statusCounts.cancelled / total;

                    const segments = [
                      { status: 'Completed', count: statusCounts.completed, pct: completedPct, strokeColor: '#10B981' },
                      { status: 'Shipped', count: statusCounts.shipped, pct: shippedPct, strokeColor: '#0EA5E9' },
                      { status: 'Pending', count: statusCounts.pending, pct: pendingPct, strokeColor: '#F59E0B' },
                      { status: 'Cancelled', count: statusCounts.cancelled, pct: cancelledPct, strokeColor: '#EF4444' },
                    ].filter(s => s.pct > 0);

                    let accumulatedPercent = 0;

                    return (
                      <div className="flex flex-col md:flex-row items-center gap-8 w-full justify-center py-4">
                        <div className="relative w-40 h-40">
                          <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="50" fill="transparent" stroke="#F0E4DB" strokeWidth="16" />
                            {segments.map((seg) => {
                              const strokeDasharray = `${seg.pct * 314.16} 314.16`;
                              const strokeDashoffset = -accumulatedPercent * 314.16;
                              accumulatedPercent += seg.pct;
                              const isHovered = hoveredSegment === seg.status;
                              return (
                                <circle key={seg.status} cx="80" cy="80" r="50" fill="transparent"
                                  stroke={seg.strokeColor} strokeWidth={isHovered ? 20 : 16}
                                  strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
                                  className="transition-all duration-200 cursor-pointer"
                                  onMouseEnter={() => setHoveredSegment(seg.status)}
                                  onMouseLeave={() => setHoveredSegment(null)}
                                />
                              );
                            })}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
                            {hoveredSegment ? (
                              <>
                                <p className="text-xs font-bold text-foreground">{hoveredSegment}</p>
                                <p className="text-sm font-black text-foreground">
                                  {statusCounts[hoveredSegment.toLowerCase() as keyof typeof statusCounts]}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {((statusCounts[hoveredSegment.toLowerCase() as keyof typeof statusCounts] / total) * 100).toFixed(0)}%
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
                                <p className="text-base font-black text-foreground">{orders.length}</p>
                                <p className="text-[10px] text-muted-foreground">Orders</p>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: 'Completed', count: statusCounts.completed, color: '#10B981' },
                            { label: 'Shipped', count: statusCounts.shipped, color: '#0EA5E9' },
                            { label: 'Pending', count: statusCounts.pending, color: '#F59E0B' },
                            { label: 'Cancelled', count: statusCounts.cancelled, color: '#EF4444' },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2 text-xs font-semibold">
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-foreground/80">{item.label}:</span>
                              <span className="text-foreground">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Info footer banner */}
          <div className="flex items-start gap-3 rounded-xl px-4.5 py-4 text-xs text-amber-800 bg-amber-50/50 border border-amber-200/60">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600/60" />
            <p>Changes are saved securely in the database and reflected immediately on all store pages.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({ icon, label, active, disabled, onClick }: {
  icon: React.ReactNode; label: string; active?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button disabled={disabled} onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
        disabled ? "opacity-25 cursor-not-allowed text-foreground/40"
          : active
            ? "text-rose-pink-dark font-bold bg-rose-100/40 border border-rose-100"
            : "text-foreground/60 hover:text-foreground hover:bg-rose-100/30"
      }`}
      style={active ? { border: "1px solid rgba(242,138,174,0.18)" } : {}}>
      <span className="w-4 h-4 shrink-0">{icon}</span>
      {label}
    </button>
  );
}
