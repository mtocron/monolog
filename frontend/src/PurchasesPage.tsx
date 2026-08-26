import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  api,
  type Purchase,
  type PurchaseCategory,
  type PurchaseInput,
} from "./api";

type Page = "list" | "detail" | "form";
type Form = PurchaseInput & { files: File[] };

const emptyForm = (categoryId = ""): Form => ({
  name: "",
  purchaseCategoryId: categoryId,
  purchasedAt: new Date().toISOString().slice(0, 10),
  price: 0,
  shop: null,
  description: null,
  files: [],
});

const yen = (price: number) =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(price);

export function PurchasesPage({ onBack }: { onBack: () => void }) {
  const [page, setPage] = useState<Page>("list");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [categories, setCategories] = useState<PurchaseCategory[]>([]);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [form, setForm] = useState<Form>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const categoryName = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const fail = (reason: unknown) =>
    setError(reason instanceof Error ? reason.message : "Request failed.");
  const reload = async () => {
    setLoading(true);
    try {
      const [nextPurchases, nextCategories] = await Promise.all([
        api.purchases.list(),
        api.purchases.listCategories(),
      ]);
      setPurchases(nextPurchases);
      setCategories(nextCategories);
    } catch (reason) {
      fail(reason);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void reload();
  }, []);
  const showDetail = async (id: string) => {
    setLoading(true);
    try {
      setPurchase(await api.purchases.get(id));
      setPage("detail");
    } catch (reason) {
      fail(reason);
    } finally {
      setLoading(false);
    }
  };
  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm(categories[0]?.id));
    setError("");
    setPage("form");
  };
  const startEdit = () => {
    if (!purchase) return;
    setEditing(purchase);
    setForm({ ...purchase, files: [] });
    setError("");
    setPage("form");
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const input: PurchaseInput = {
        name: form.name.trim(),
        purchaseCategoryId: form.purchaseCategoryId,
        purchasedAt: form.purchasedAt,
        price: Number(form.price),
        shop: form.shop?.trim() || null,
        description: form.description?.trim() || null,
      };
      const saved = editing
        ? await api.purchases.update(editing.id, input)
        : await api.purchases.create(input);
      if (form.files.length)
        await api.purchases.uploadImages(saved.id, form.files);
      await reload();
      await showDetail(saved.id);
    } catch (reason) {
      fail(reason);
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!purchase || !confirm("この購入記録を削除しますか？")) return;
    try {
      await api.purchases.remove(purchase.id);
      setPurchase(null);
      setPage("list");
      await reload();
    } catch (reason) {
      fail(reason);
    }
  };
  const removeImage = async (imageId: string) => {
    if (!purchase || !confirm("この画像を削除しますか？")) return;
    try {
      await api.purchases.removeImage(purchase.id, imageId);
      await showDetail(purchase.id);
      await reload();
    } catch (reason) {
      fail(reason);
    }
  };

  return (
    <section className="purchases-page">
      <div className="heading">
        <div>
          <small>Purchases</small>
          <h1>購入記録</h1>
        </div>
        {page === "list" && (
          <button className="primary" onClick={startCreate}>
            新しい購入記録
          </button>
        )}
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}
      {page === "list" &&
        (loading ? (
          <p className="state">読み込み中…</p>
        ) : purchases.length ? (
          <div className="purchase-list">
            {purchases.map((item) => (
              <button
                className="purchase-card"
                key={item.id}
                onClick={() => void showDetail(item.id)}
              >
                <span className="purchase-card-image">
                  {item.images[0] ? (
                    <img
                      src={api.purchases.imageUrl(item.id, item.images[0].id)}
                      alt=""
                    />
                  ) : (
                    ""
                  )}
                </span>
                <span>
                  <time>{item.purchasedAt}</time>
                  <strong>{item.name}</strong>
                  <small>
                    {categoryName.get(item.purchaseCategoryId) ??
                      item.purchaseCategory.name}{" "}
                    · {yen(item.price)}
                  </small>
                  {item.shop && <small>{item.shop}</small>}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="state">購入記録はまだありません。</p>
        ))}
      {page === "detail" && purchase && (
        <>
          <div className="actions">
            <button onClick={() => setPage("list")}>一覧へ</button>
            <span>
              <button onClick={startEdit}>編集</button>
              <button className="danger" onClick={() => void remove()}>
                削除
              </button>
            </span>
          </div>
          <article className="detail purchase-detail">
            <time>{purchase.purchasedAt}</time>
            <h2>{purchase.name}</h2>
            <p className="purchase-price">{yen(purchase.price)}</p>
            <dl>
              <div>
                <dt>カテゴリ</dt>
                <dd>{purchase.purchaseCategory.name}</dd>
              </div>
              {purchase.shop && (
                <div>
                  <dt>ショップ</dt>
                  <dd>{purchase.shop}</dd>
                </div>
              )}
            </dl>
            {purchase.description && <p>{purchase.description}</p>}
            {purchase.images.length > 0 && (
              <div className="images">
                {purchase.images.map((image) => (
                  <figure key={image.id}>
                    <img
                      src={api.purchases.imageUrl(purchase.id, image.id)}
                      alt={image.originalFileName}
                    />
                    <button
                      className="danger"
                      onClick={() => void removeImage(image.id)}
                    >
                      画像を削除
                    </button>
                  </figure>
                ))}
              </div>
            )}
          </article>
        </>
      )}
      {page === "form" && (
        <PurchaseForm
          form={form}
          categories={categories}
          saving={saving}
          editing={Boolean(editing)}
          setForm={setForm}
          save={save}
          cancel={() => setPage(editing ? "detail" : "list")}
        />
      )}
      <p className="right">
        <button onClick={onBack}>記録一覧へ戻る</button>
      </p>
    </section>
  );
}

function PurchaseForm({
  form,
  categories,
  saving,
  editing,
  setForm,
  save,
  cancel,
}: {
  form: Form;
  categories: PurchaseCategory[];
  saving: boolean;
  editing: boolean;
  setForm: (form: Form) => void;
  save: (event: FormEvent) => void;
  cancel: () => void;
}) {
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm({ ...form, [key]: value });
  return (
    <form onSubmit={save} className="purchase-form">
      <label>
        名前
        <input
          required
          maxLength={255}
          autoFocus
          value={form.name}
          onChange={(event) => set("name", event.target.value)}
        />
      </label>
      <div className="grid">
        <label>
          カテゴリ
          <select
            required
            value={form.purchaseCategoryId}
            onChange={(event) => set("purchaseCategoryId", event.target.value)}
          >
            <option value="" disabled>
              選択してください
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          購入日
          <input
            required
            type="date"
            value={form.purchasedAt}
            onChange={(event) => set("purchasedAt", event.target.value)}
          />
        </label>
      </div>
      <div className="grid">
        <label>
          価格（円）
          <input
            required
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={(event) => set("price", Number(event.target.value))}
          />
        </label>
        <label>
          ショップ
          <input
            maxLength={255}
            value={form.shop ?? ""}
            onChange={(event) => set("shop", event.target.value)}
          />
        </label>
      </div>
      <label>
        説明
        <textarea
          maxLength={10000}
          value={form.description ?? ""}
          onChange={(event) => set("description", event.target.value)}
        />
      </label>
      <label>
        画像（JPEG / PNG / WebP、最大10枚）
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) =>
            set("files", Array.from(event.target.files ?? []))
          }
        />
        {form.files.length > 0 && (
          <small>{form.files.map((file) => file.name).join("、")}</small>
        )}
      </label>
      <div className="actions">
        <button type="button" onClick={cancel}>
          キャンセル
        </button>
        <button className="primary" disabled={saving || !categories.length}>
          {saving ? "保存中…" : editing ? "更新する" : "保存する"}
        </button>
      </div>
    </form>
  );
}
