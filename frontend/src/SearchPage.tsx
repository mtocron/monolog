import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  api,
  type Emotion,
  type Entry,
  type EntrySearch,
  type Purchase,
  type PurchaseCategory,
  type PurchaseSearch,
} from "./api";
import { EmptyState, LoadingState, Notice } from "./Ux";

const emotions: { id: Emotion; label: string }[] = [
  { id: "happy", label: "Happy" }, { id: "calm", label: "Calm" },
  { id: "sad", label: "Sad" }, { id: "angry", label: "Angry" },
  { id: "anxious", label: "Anxious" }, { id: "tired", label: "Tired" },
  { id: "excited", label: "Excited" },
];
const yen = (value: number) => new Intl.NumberFormat("ja-JP", {
  style: "currency", currency: "JPY", maximumFractionDigits: 0,
}).format(value);

export function SearchPage({
  onEntry,
  onPurchase,
}: {
  onEntry: (id: string) => void;
  onPurchase: (id: string) => void;
}) {
  const [entryQuery, setEntryQuery] = useState<EntrySearch>({});
  const [purchaseQuery, setPurchaseQuery] = useState<PurchaseSearch>({});
  const [categories, setCategories] = useState<PurchaseCategory[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { void api.purchases.listCategories().then(setCategories).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Request failed.")); }, []);
  const search = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const [nextEntries, nextPurchases] = await Promise.all([
        api.entries.list(entryQuery), api.purchases.list(purchaseQuery),
      ]);
      setEntries(nextEntries); setPurchases(nextPurchases); setSearched(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Request failed.");
    } finally { setLoading(false); }
  };
  const setEntry = <K extends keyof EntrySearch>(key: K, value: EntrySearch[K]) => setEntryQuery({ ...entryQuery, [key]: value });
  const setPurchase = <K extends keyof PurchaseSearch>(key: K, value: PurchaseSearch[K]) => setPurchaseQuery({ ...purchaseQuery, [key]: value });
  return <section className="search-page">
    <div className="heading"><div><small>Search</small><h1>検索</h1></div></div>
    {error && <Notice kind="error" onClose={() => setError("")}>{error}</Notice>}
    <form className="search-form" onSubmit={(event) => void search(event)}>
      <section><h2>Entry</h2><div className="search-grid">
        <label>本文<input value={entryQuery.content ?? ""} onChange={(event) => setEntry("content", event.target.value)} /></label>
        <label>タグ<input value={entryQuery.tag ?? ""} onChange={(event) => setEntry("tag", event.target.value)} /></label>
        <label>日付（開始）<input type="date" value={entryQuery.recordedFrom ?? ""} onChange={(event) => setEntry("recordedFrom", event.target.value)} /></label>
        <label>日付（終了）<input type="date" value={entryQuery.recordedTo ?? ""} onChange={(event) => setEntry("recordedTo", event.target.value)} /></label>
        <label>感情<select value={entryQuery.emotion ?? ""} onChange={(event) => setEntry("emotion", event.target.value as Emotion || undefined)}><option value="">すべて</option>{emotions.map((emotion) => <option key={emotion.id} value={emotion.id}>{emotion.label}</option>)}</select></label>
        <label>場所<input value={entryQuery.location ?? ""} onChange={(event) => setEntry("location", event.target.value)} /></label>
      </div></section>
      <section><h2>Purchase</h2><div className="search-grid">
        <label>名前<input value={purchaseQuery.name ?? ""} onChange={(event) => setPurchase("name", event.target.value)} /></label>
        <label>カテゴリ<select value={purchaseQuery.purchaseCategoryId ?? ""} onChange={(event) => setPurchase("purchaseCategoryId", event.target.value || undefined)}><option value="">すべて</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>購入日（開始）<input type="date" value={purchaseQuery.purchasedFrom ?? ""} onChange={(event) => setPurchase("purchasedFrom", event.target.value)} /></label>
        <label>購入日（終了）<input type="date" value={purchaseQuery.purchasedTo ?? ""} onChange={(event) => setPurchase("purchasedTo", event.target.value)} /></label>
        <label>店舗<input value={purchaseQuery.shop ?? ""} onChange={(event) => setPurchase("shop", event.target.value)} /></label>
        <label>金額（最小）<input type="number" min="0" step="1" value={purchaseQuery.minPrice ?? ""} onChange={(event) => setPurchase("minPrice", event.target.value === "" ? undefined : Number(event.target.value))} /></label>
        <label>金額（最大）<input type="number" min="0" step="1" value={purchaseQuery.maxPrice ?? ""} onChange={(event) => setPurchase("maxPrice", event.target.value === "" ? undefined : Number(event.target.value))} /></label>
      </div></section>
      <div className="right"><button className="primary" disabled={loading}>{loading ? "検索中…" : "検索"}</button></div>
    </form>
    {loading ? <LoadingState /> : searched && <div className="search-results">
      <section><h2>Entry（{entries.length}件）</h2>{entries.length ? <div className="list">{entries.map((entry) => <button className="search-result" key={entry.id} onClick={() => onEntry(entry.id)}><time>{new Date(entry.recordedAt).toLocaleString("ja-JP")}</time><strong>{entry.content}</strong><small>{entry.entryTags.map(({ tag }) => `#${tag.name}`).join(" ")}</small></button>)}</div> : <EmptyState>該当するEntryはありません。</EmptyState>}</section>
      <section><h2>Purchase（{purchases.length}件）</h2>{purchases.length ? <div className="purchase-list">{purchases.map((purchase) => <button className="search-result" key={purchase.id} onClick={() => onPurchase(purchase.id)}><time>{purchase.purchasedAt}</time><strong>{purchase.name}</strong><small>{purchase.purchaseCategory.name} · {yen(purchase.price)}{purchase.shop ? ` · ${purchase.shop}` : ""}</small></button>)}</div> : <EmptyState>該当するPurchaseはありません。</EmptyState>}</section>
    </div>}
  </section>;
}
