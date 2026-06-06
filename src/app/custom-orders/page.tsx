"use client";

import { useState, useMemo, useRef, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateCustomOrderMessage } from "@/lib/whatsapp";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Plus,
  Minus,
  Upload,
  ImageIcon,
  X,
  User,
  Palette,
  Package,
  Calendar,
  MapPin,
  FileImage,
  StickyNote,
  ClipboardCheck,
  PartyPopper,
  MessageCircle,
  DollarSign,
  ShoppingBag,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface FormData {
  name: string;
  email: string;
  phone: string;
  productType: string;
  colors: string[];
  quantity: number;
  budget: string;
  deliveryDate: string;
  addressLine: string;
  city: string;
  pincode: string;
  referenceImages: File[];
  notes: string;
}

const INITIAL_FORM: FormData = {
  name: "",
  email: "",
  phone: "",
  productType: "",
  colors: [],
  quantity: 1,
  budget: "",
  deliveryDate: "",
  addressLine: "",
  city: "",
  pincode: "",
  referenceImages: [],
  notes: "",
};

/* ─── Static Data ────────────────────────────────────────────────────── */

const PRODUCT_TYPES = [
  { id: "bouquet", label: "Bouquet", emoji: "💐" },
  { id: "single-flower", label: "Single Flower", emoji: "🌹" },
  { id: "amigurumi", label: "Amigurumi", emoji: "🧸" },
  { id: "keychain", label: "Keychain", emoji: "🔑" },
  { id: "home-decor", label: "Home Decor", emoji: "🏡" },
  { id: "fashion", label: "Fashion Item", emoji: "👜" },
  { id: "baby-item", label: "Baby Item", emoji: "👶" },
  { id: "other", label: "Other / Custom", emoji: "✨" },
];

const COLOR_SWATCHES = [
  { id: "red", label: "Red", hex: "#E53E3E" },
  { id: "rose-pink", label: "Rose Pink", hex: "#F28AAE" },
  { id: "peach", label: "Peach", hex: "#FDBA9B" },
  { id: "sunflower", label: "Sunflower", hex: "#F6C445" },
  { id: "sage", label: "Sage Green", hex: "#8FAE8A" },
  { id: "mint", label: "Mint", hex: "#A8E6CF" },
  { id: "sky-blue", label: "Sky Blue", hex: "#90CDF4" },
  { id: "lavender", label: "Lavender", hex: "#CDB4DB" },
  { id: "purple", label: "Purple", hex: "#9F7AEA" },
  { id: "cream", label: "Cream", hex: "#FFF7F2" },
  { id: "white", label: "White", hex: "#FFFFFF" },
  { id: "brown", label: "Brown", hex: "#A0826D" },
];

const BUDGET_OPTIONS = [
  { id: "under-500", label: "Under ₹500" },
  { id: "500-1000", label: "₹500 – ₹1,000" },
  { id: "1000-2000", label: "₹1,000 – ₹2,000" },
  { id: "2000-5000", label: "₹2,000 – ₹5,000" },
  { id: "above-5000", label: "Above ₹5,000" },
  { id: "flexible", label: "Flexible / Decide Later" },
];

const STEP_META = [
  { label: "Details", icon: User },
  { label: "Product", icon: ShoppingBag },
  { label: "Colors", icon: Palette },
  { label: "Quantity", icon: Package },
  { label: "Budget", icon: DollarSign },
  { label: "Date", icon: Calendar },
  { label: "Address", icon: MapPin },
  { label: "Images", icon: FileImage },
  { label: "Notes", icon: StickyNote },
  { label: "Review", icon: ClipboardCheck },
  { label: "Done!", icon: PartyPopper },
];

const TOTAL_STEPS = STEP_META.length;

/* ─── Helpers ────────────────────────────────────────────────────────── */

function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

/* ─── Component ──────────────────────────────────────────────────────── */

export default function CustomOrdersPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Validation per step ── */
  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    switch (s) {
      case 0:
        if (!form.name.trim()) errs.name = "Name is required";
        if (!form.phone.trim()) errs.phone = "Phone number is required";
        else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, "")))
          errs.phone = "Enter a valid 10-digit phone number";
        break;
      case 1:
        if (!form.productType) errs.productType = "Select a product type";
        break;
      case 2:
        if (form.colors.length === 0) errs.colors = "Pick at least one colour";
        break;
      case 4:
        if (!form.budget) errs.budget = "Select a budget range";
        break;
      case 5:
        if (!form.deliveryDate)
          errs.deliveryDate = "Select a delivery date";
        break;
      case 6:
        if (!form.addressLine.trim())
          errs.addressLine = "Address is required";
        if (!form.city.trim()) errs.city = "City is required";
        if (!form.pincode.trim()) errs.pincode = "Pincode is required";
        else if (!/^\d{6}$/.test(form.pincode))
          errs.pincode = "Enter a valid 6-digit pincode";
        break;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };
  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  /* ── Field updaters ── */
  const setField = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const toggleColor = (id: string) => {
    setForm((f) => ({
      ...f,
      colors: f.colors.includes(id)
        ? f.colors.filter((c) => c !== id)
        : [...f.colors, id],
    }));
  };

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 5);
      setField("referenceImages", [
        ...form.referenceImages,
        ...newFiles,
      ].slice(0, 5));
    }
  };

  const removeImage = (idx: number) => {
    setField(
      "referenceImages",
      form.referenceImages.filter((_, i) => i !== idx)
    );
  };

  /* ── Submit ── */
  const handleSubmit = () => {
    setDirection(1);
    setStep(TOTAL_STEPS - 1);
  };

  const openWhatsApp = () => {
    const link = generateCustomOrderMessage({
      name: form.name,
      phone: form.phone,
      productType: form.productType,
      colors: form.colors
        .map(
          (cid) =>
            COLOR_SWATCHES.find((s) => s.id === cid)?.label || cid
        )
        .join(", "),
      quantity: form.quantity,
      budget:
        BUDGET_OPTIONS.find((b) => b.id === form.budget)?.label ||
        form.budget,
      deliveryDate: form.deliveryDate,
      address: `${form.addressLine}, ${form.city} — ${form.pincode}`,
      notes: form.notes || "None",
    });
    window.open(link, "_blank", "noopener,noreferrer");
  };

  /* ── Progress percentage ── */
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  /* ── Animation variants ── */
  const variants = {
    enter: (d: number) => ({
      x: d > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({
      x: d > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  /* ── Formatted date ── */
  const formattedDate = useMemo(() => {
    if (!form.deliveryDate) return "";
    return new Date(form.deliveryDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [form.deliveryDate]);

  /* ── Render step content ── */
  const renderStep = () => {
    switch (step) {
      /* ═══ Step 0: Customer Details ═══ */
      case 0:
        return (
          <div className="space-y-5">
            <StepHeading emoji="👤" title="Tell us about yourself" />
            <Field label="Full Name *" error={errors.name}>
              <Input
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="rounded-xl"
              />
            </Field>
            <Field label="Email (optional)">
              <Input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className="rounded-xl"
              />
            </Field>
            <Field label="Phone Number *" error={errors.phone}>
              <Input
                type="tel"
                placeholder="98XXXXXXXX"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className="rounded-xl"
                maxLength={10}
              />
            </Field>
          </div>
        );

      /* ═══ Step 1: Product Type ═══ */
      case 1:
        return (
          <div className="space-y-5">
            <StepHeading emoji="🧶" title="What would you like?" />
            {errors.productType && (
              <p className="text-sm text-red-500">{errors.productType}</p>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PRODUCT_TYPES.map((pt) => {
                const active = form.productType === pt.id;
                return (
                  <motion.button
                    key={pt.id}
                    type="button"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setField("productType", pt.id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all ${
                      active
                        ? "border-rose-pink bg-rose-pink/5 shadow-md shadow-rose-pink/10"
                        : "border-border bg-card hover:border-rose-pink-light"
                    }`}
                  >
                    <span className="text-3xl">{pt.emoji}</span>
                    <span className="text-sm font-medium text-foreground">
                      {pt.label}
                    </span>
                    {active && (
                      <Check className="size-4 text-rose-pink" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );

      /* ═══ Step 2: Colors ═══ */
      case 2:
        return (
          <div className="space-y-5">
            <StepHeading
              emoji="🎨"
              title="Pick your colours"
              subtitle="Select one or more"
            />
            {errors.colors && (
              <p className="text-sm text-red-500">{errors.colors}</p>
            )}
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {COLOR_SWATCHES.map((c) => {
                const active = form.colors.includes(c.id);
                return (
                  <motion.button
                    key={c.id}
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleColor(c.id)}
                    className="flex flex-col items-center gap-1.5"
                    aria-label={`${active ? "Deselect" : "Select"} ${c.label}`}
                  >
                    <span
                      className={`flex size-12 items-center justify-center rounded-full border-2 shadow-sm transition-all ${
                        active
                          ? "border-foreground ring-2 ring-rose-pink ring-offset-2"
                          : "border-border"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {active && (
                        <Check
                          className="size-5 drop-shadow-sm"
                          style={{
                            color:
                              c.id === "white" || c.id === "cream"
                                ? "#333"
                                : "#fff",
                          }}
                        />
                      )}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {c.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );

      /* ═══ Step 3: Quantity ═══ */
      case 3:
        return (
          <div className="flex flex-col items-center gap-6">
            <StepHeading emoji="📦" title="How many do you need?" />
            <div className="flex items-center gap-5">
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() =>
                  setField("quantity", Math.max(1, form.quantity - 1))
                }
                className="flex size-14 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-rose-pink/10"
                aria-label="Decrease quantity"
              >
                <Minus className="size-5" />
              </motion.button>
              <motion.span
                key={form.quantity}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="min-w-[4rem] text-center text-5xl font-bold text-rose-pink tabular-nums"
              >
                {form.quantity}
              </motion.span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setField("quantity", form.quantity + 1)}
                className="flex size-14 items-center justify-center rounded-full border border-rose-pink bg-rose-pink/10 text-rose-pink transition-colors hover:bg-rose-pink hover:text-white"
                aria-label="Increase quantity"
              >
                <Plus className="size-5" />
              </motion.button>
            </div>
            <p className="text-sm text-muted-foreground">
              {form.quantity === 1 ? "piece" : "pieces"}
            </p>
          </div>
        );

      /* ═══ Step 4: Budget ═══ */
      case 4:
        return (
          <div className="space-y-5">
            <StepHeading emoji="💰" title="What's your budget range?" />
            {errors.budget && (
              <p className="text-sm text-red-500">{errors.budget}</p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {BUDGET_OPTIONS.map((b) => {
                const active = form.budget === b.id;
                return (
                  <label
                    key={b.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                      active
                        ? "border-rose-pink bg-rose-pink/5 shadow-sm"
                        : "border-border bg-card hover:border-rose-pink-light"
                    }`}
                  >
                    <input
                      type="radio"
                      name="budget"
                      value={b.id}
                      checked={active}
                      onChange={() => setField("budget", b.id)}
                      className="accent-rose-pink"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {b.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );

      /* ═══ Step 5: Delivery Date ═══ */
      case 5:
        return (
          <div className="space-y-5">
            <StepHeading
              emoji="📅"
              title="When do you need it?"
              subtitle="We need at least 7 days for handmade items"
            />
            {errors.deliveryDate && (
              <p className="text-sm text-red-500">{errors.deliveryDate}</p>
            )}
            <Input
              type="date"
              min={getMinDate()}
              value={form.deliveryDate}
              onChange={(e) => setField("deliveryDate", e.target.value)}
              className="mx-auto max-w-xs rounded-xl text-center"
            />
            {formattedDate && (
              <p className="text-center text-sm text-sage">
                Selected: <strong>{formattedDate}</strong>
              </p>
            )}
          </div>
        );

      /* ═══ Step 6: Address ═══ */
      case 6:
        return (
          <div className="space-y-5">
            <StepHeading emoji="📍" title="Delivery Address" />
            <Field label="Address *" error={errors.addressLine}>
              <Textarea
                placeholder="House no, street, landmark…"
                value={form.addressLine}
                onChange={(e) => setField("addressLine", e.target.value)}
                className="min-h-20 rounded-xl"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="City *" error={errors.city}>
                <Input
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  className="rounded-xl"
                />
              </Field>
              <Field label="Pincode *" error={errors.pincode}>
                <Input
                  placeholder="6-digit pincode"
                  value={form.pincode}
                  onChange={(e) => setField("pincode", e.target.value)}
                  className="rounded-xl"
                  maxLength={6}
                />
              </Field>
            </div>
          </div>
        );

      /* ═══ Step 7: Reference Images ═══ */
      case 7:
        return (
          <div className="space-y-5">
            <StepHeading
              emoji="🖼️"
              title="Reference Images"
              subtitle="Upload up to 5 images for inspiration (optional)"
            />
            {/* Drop zone */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files) {
                  const dropped = Array.from(e.dataTransfer.files)
                    .filter((f) => f.type.startsWith("image/"))
                    .slice(0, 5);
                  setField(
                    "referenceImages",
                    [...form.referenceImages, ...dropped].slice(0, 5)
                  );
                }
              }}
              className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-rose-pink/30 bg-rose-pink/5 p-8 transition-colors hover:border-rose-pink/60 hover:bg-rose-pink/10"
            >
              <Upload className="size-8 text-rose-pink" />
              <p className="text-sm text-muted-foreground">
                Drag & drop images here, or{" "}
                <span className="font-medium text-rose-pink">browse</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="hidden"
              />
            </div>
            {/* Preview */}
            {form.referenceImages.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {form.referenceImages.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border bg-cream"
                  >
                    <ImageIcon className="size-8 text-rose-pink/40" />
                    <span className="absolute bottom-1 left-1 right-1 truncate rounded bg-black/50 px-1 py-0.5 text-[10px] text-white">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      /* ═══ Step 8: Notes ═══ */
      case 8:
        return (
          <div className="space-y-5">
            <StepHeading
              emoji="📝"
              title="Anything else?"
              subtitle="Special instructions, customizations, messages, etc."
            />
            <Textarea
              placeholder="Tell us anything specific you'd like…"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              className="min-h-32 rounded-xl"
              maxLength={600}
            />
            <p className="text-right text-xs text-muted-foreground">
              {form.notes.length}/600
            </p>
          </div>
        );

      /* ═══ Step 9: Review ═══ */
      case 9:
        return (
          <div className="space-y-5">
            <StepHeading emoji="✅" title="Review Your Order" />
            <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
              <ReviewRow label="Name" value={form.name} />
              <ReviewRow label="Phone" value={form.phone} />
              {form.email && <ReviewRow label="Email" value={form.email} />}
              <ReviewRow
                label="Product"
                value={
                  PRODUCT_TYPES.find((p) => p.id === form.productType)
                    ?.label || form.productType
                }
              />
              <ReviewRow
                label="Colors"
                value={form.colors
                  .map(
                    (cid) =>
                      COLOR_SWATCHES.find((c) => c.id === cid)?.label || cid
                  )
                  .join(", ")}
              />
              <ReviewRow label="Quantity" value={String(form.quantity)} />
              <ReviewRow
                label="Budget"
                value={
                  BUDGET_OPTIONS.find((b) => b.id === form.budget)?.label ||
                  form.budget
                }
              />
              <ReviewRow label="Delivery" value={formattedDate} />
              <ReviewRow
                label="Address"
                value={`${form.addressLine}, ${form.city} — ${form.pincode}`}
              />
              {form.referenceImages.length > 0 && (
                <ReviewRow
                  label="Images"
                  value={`${form.referenceImages.length} image(s) attached`}
                />
              )}
              {form.notes && <ReviewRow label="Notes" value={form.notes} />}
            </div>
          </div>
        );

      /* ═══ Step 10: Success ═══ */
      case 10:
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex flex-col items-center gap-5 py-8 text-center"
          >
            <motion.span
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="flex size-20 items-center justify-center rounded-full bg-sage/10 text-5xl"
            >
              🎉
            </motion.span>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Order Submitted!
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Thank you, {form.name}! Send us your order details on WhatsApp and
              we&apos;ll get started on your custom creation.
            </p>
            <Button
              onClick={openWhatsApp}
              className="h-12 gap-2 rounded-xl bg-sage px-8 text-white hover:bg-sage-dark"
            >
              <MessageCircle className="size-5" />
              Send on WhatsApp
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const isLastContentStep = step === 9;
  const isSuccessStep = step === TOTAL_STEPS - 1;

  return (
    <section className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 text-center sm:pt-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          Custom Orders{" "}
          <span className="inline-block animate-bounce">✨</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-2 max-w-md text-sm text-muted-foreground"
        >
          Tell us exactly what you envision — we&apos;ll bring it to life,
          stitch by stitch.
        </motion.p>
      </div>

      {/* Progress bar */}
      {!isSuccessStep && (
        <div className="mx-auto max-w-2xl px-4 pt-4 pb-2">
          {/* Step indicators */}
          <div className="mb-2 flex items-center justify-between">
            {STEP_META.slice(0, -1).map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const active = i === step;
              return (
                <div
                  key={s.label}
                  className="flex flex-col items-center gap-0.5"
                >
                  <span
                    className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      done
                        ? "bg-sage text-white"
                        : active
                          ? "bg-rose-pink text-white shadow-md shadow-rose-pink/30"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="size-4" /> : <Icon className="size-3.5" />}
                  </span>
                  <span className="hidden text-[9px] text-muted-foreground sm:block">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-rose-pink to-lavender"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
          <p className="mt-1.5 text-center text-xs text-muted-foreground">
            Step {step + 1} of {TOTAL_STEPS - 1}
          </p>
        </div>
      )}

      {/* Step content */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-lg shadow-rose-pink/5 sm:p-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {!isSuccessStep && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={step === 0}
              className="h-10 gap-1.5 rounded-xl px-5"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {isLastContentStep ? (
              <Button
                onClick={handleSubmit}
                className="h-10 gap-1.5 rounded-xl bg-rose-pink px-6 text-white hover:bg-rose-pink-dark"
              >
                Submit Order
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={goNext}
                className="h-10 gap-1.5 rounded-xl bg-rose-pink px-6 text-white hover:bg-rose-pink-dark"
              >
                Next
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────── */

function StepHeading({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center">
      <span className="mb-1 inline-block text-3xl">{emoji}</span>
      <h2 className="font-heading text-xl font-semibold text-foreground">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed border-border pb-2 last:border-0 last:pb-0">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm text-foreground">{value}</span>
    </div>
  );
}
