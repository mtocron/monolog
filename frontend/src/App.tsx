import { createElement, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Angry,
  BatteryLow,
  Cloud,
  CloudRain,
  CloudSun,
  CloudSunRain,
  Frown,
  FileText,
  Laugh,
  Plus,
  Settings,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Sun,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  api,
  type Emotion,
  type Entry,
  type EntryInput,
  type Purchase,
  type Theme,
  type Tag,
  type Weather,
} from "./api";
import { PurchasesPage } from "./PurchasesPage";
import { SearchPage } from "./SearchPage";
import { ConfirmDialog, EmptyState, ImageFilePreview, LoadingState, Notice } from "./Ux";
import "./App.css";

type IconChoice<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
};
const emotions: IconChoice<Emotion>[] = [
  { id: "happy", label: "嬉しい", icon: Laugh },
  { id: "calm", label: "穏やか", icon: Sun },
  { id: "sad", label: "悲しい", icon: Frown },
  { id: "angry", label: "怒り", icon: Angry },
  { id: "anxious", label: "不安", icon: TriangleAlert },
  { id: "tired", label: "疲れた", icon: BatteryLow },
  { id: "excited", label: "わくわく", icon: Sparkles },
];
const weather: IconChoice<Weather>[] = [
  { id: "sunny", label: "晴れ", icon: Sun },
  { id: "cloudy", label: "くもり", icon: Cloud },
  { id: "rainy", label: "雨", icon: CloudRain },
  { id: "snowy", label: "雪", icon: Snowflake },
  { id: "sunny_cloudy", label: "晴れのちくもり", icon: CloudSun },
  { id: "sunny_rainy", label: "晴れのち雨", icon: CloudSunRain },
  { id: "cloudy_rainy", label: "くもりのち雨", icon: CloudRain },
];
const legacyEmotionLabels: Record<string, string> = {
  very_happy: "嬉しい",
  neutral: "穏やか",
  very_sad: "悲しい",
};
const legacyEmotionIcons: Record<string, LucideIcon> = {
  very_happy: Laugh,
  neutral: Sun,
  very_sad: Frown,
};
const label = (choices: IconChoice<string>[], value: string | null) =>
  choices.find((choice) => choice.id === value)?.label ??
  (value ? (legacyEmotionLabels[value] ?? value) : undefined);
const icon = (
  choices: IconChoice<string>[],
  value: string,
): LucideIcon | null =>
  choices.find((choice) => choice.id === value)?.icon ??
  legacyEmotionIcons[value] ??
  null;
const dateTime = (date = new Date()) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
const format = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
type Form = EntryInput & { tagIds: string[]; purchaseIds: string[]; files: File[] };
type CreateKind = "entry" | "purchase";
const emptyForm = (): Form => ({
  content: "",
  recordedAt: new Date().toISOString(),
  emotion: null,
  weather: null,
  location: null,
  tagIds: [],
  purchaseIds: [],
  files: [],
});

function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [page, setPage] = useState<
    "list" | "detail" | "form" | "settings" | "purchases" | "search"
  >("list");
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [startPurchaseCreate, setStartPurchaseCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<"entry" | string | null>(null);
  const [tagName, setTagName] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const [imageRootPath, setImageRootPath] = useState("");
  const fail = (reason: unknown) =>
    setError(reason instanceof Error ? reason.message : "操作に失敗しました。");
  const reload = async () => {
    setLoading(true);
    try {
      const [nextEntries, nextTags, nextPurchases, settings] = await Promise.all([
        api.entries.list(),
        api.tags.list(),
        api.purchases.list(),
        api.settings.list(),
      ]);
      setEntries(nextEntries);
      setTags(nextTags);
      setPurchases(nextPurchases);
      const values = new Map(
        settings.map((setting) => [setting.key, setting.value]),
      );
      const savedTheme = values.get("appearance.theme");
      if (
        savedTheme === "light" ||
        savedTheme === "dark" ||
        savedTheme === "capture"
      ) {
        setTheme(savedTheme);
      }
      setImageRootPath(values.get("image.root_path") ?? "");
    } catch (reason) {
      fail(reason);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void reload();
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const detail = async (id: string) => {
    setLoading(true);
    try {
      setEntry(await api.entries.get(id));
      setPage("detail");
    } catch (reason) {
      fail(reason);
    } finally {
      setLoading(false);
    }
  };
  const create = () => {
    setEditing(null);
    const draft = sessionStorage.getItem("monolog.entry-draft");
    setForm(draft ? { ...emptyForm(), ...(JSON.parse(draft) as Partial<Form>) } : emptyForm());
    setError("");
    setPage("form");
  };
  const openCreate = (kind: CreateKind) => {
    if (kind === "entry") {
      create();
      return;
    }
    setSelectedPurchaseId(null);
    setStartPurchaseCreate(true);
    setPage("purchases");
  };
  const timeline = [
    ...entries.map((item) => ({ kind: "entry" as const, item, occurredAt: item.recordedAt })),
    ...purchases.map((item) => ({ kind: "purchase" as const, item, occurredAt: item.purchasedAt })),
  ].sort((left, right) => {
    const byDate = new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime();
    return byDate || right.item.id.localeCompare(left.item.id);
  });
  const changeTheme = async (nextTheme: Theme) => {
    const previousTheme = theme;
    setTheme(nextTheme);
    setError("");
    try {
      await api.settings.update("appearance.theme", nextTheme);
    } catch (reason) {
      setTheme(previousTheme);
      fail(reason);
    }
  };
  const saveImageRootPath = async () => {
    setSaving(true);
    setError("");
    try {
      const setting = await api.settings.update(
        "image.root_path",
        imageRootPath.trim(),
      );
      setImageRootPath(setting.value ?? "");
    } catch (reason) {
      fail(reason);
    } finally {
      setSaving(false);
    }
  };
  const edit = () => {
    if (!entry) return;
    setEditing(entry);
    setForm({
      content: entry.content,
      recordedAt: entry.recordedAt,
      emotion: entry.emotion,
      weather: entry.weather,
      location: entry.location,
      tagIds: entry.entryTags.map((relation) => relation.tagId),
      purchaseIds: entry.entryPurchases.map((relation) => relation.purchaseId),
      files: [],
    });
    setPage("form");
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const input: EntryInput = {
        content: form.content.trim(),
        recordedAt: new Date(form.recordedAt).toISOString(),
        emotion: form.emotion,
        weather: form.weather,
        location: form.location?.trim() || null,
      };
      const saved = editing
        ? await api.entries.update(editing.id, input)
        : await api.entries.create(input);
      const old = new Set(
        editing?.entryTags.map((relation) => relation.tagId) ?? [],
      );
      await Promise.all([
        ...form.tagIds
          .filter((id) => !old.has(id))
          .map((id) => api.entries.attachTag(saved.id, id)),
        ...[...old]
          .filter((id) => !form.tagIds.includes(id))
          .map((id) => api.entries.detachTag(saved.id, id)),
        ...form.purchaseIds
          .filter(
            (id) =>
              !editing?.entryPurchases.some(
                (relation) => relation.purchaseId === id,
              ),
          )
          .map((id) => api.entries.attachPurchase(saved.id, id)),
        ...(editing?.entryPurchases.map((relation) => relation.purchaseId) ?? [])
          .filter((id) => !form.purchaseIds.includes(id))
          .map((id) => api.entries.detachPurchase(saved.id, id)),
      ]);
      if (form.files.length)
        await api.entries.uploadImages(saved.id, form.files);
      setEntry(await api.entries.get(saved.id));
      await reload();
      sessionStorage.removeItem("monolog.entry-draft");
      setSuccess(editing ? "記録を更新しました。" : "記録を保存しました。");
      setPage("detail");
    } catch (reason) {
      fail(reason);
    } finally {
      setSaving(false);
    }
  };
  const addTag = async () => {
    if (!tagName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const tag = await api.tags.create(tagName.trim());
      setTags((current) => [...current, tag]);
      setTagName("");
    } catch (reason) {
      fail(reason);
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!entry) return;
    try {
      await api.entries.remove(entry.id);
      setPage("list");
      setEntry(null);
      await reload();
      setSuccess("記録を削除しました。");
    } catch (reason) {
      fail(reason);
    }
  };
  const removeImage = async (id: string) => {
    if (!entry) return;
    try {
      await api.entries.removeImage(entry.id, id);
      setEntry(await api.entries.get(entry.id));
      await reload();
      setSuccess("画像を削除しました。");
    } catch (reason) {
      fail(reason);
    }
  };
  return (
    <main className="app">
      <header>
        <button className="brand" onClick={() => setPage("list")}>
          monolog
        </button>
        <div className="header-actions">
          <button onClick={() => setPage("search")}>Search</button>
          <button
            className="settings-button"
            aria-label="Settings"
            title="Settings"
            onClick={() => setPage("settings")}
          >
            <Settings aria-hidden="true" />
          </button>
          <CreateMenu onSelect={openCreate} />
          <button className="primary" onClick={create}>
            記録する
          </button>
        </div>
      </header>
      {error && <Notice kind="error" onClose={() => setError("")}>{error}</Notice>}
      {success && <Notice kind="success" onClose={() => setSuccess("")}>{success}</Notice>}
      {page === "list" && (
        <>
          <div className="heading">
            <div>
              <small>Timeline</small>
              <h1>記録</h1>
            </div>
            <button className="primary" onClick={create}>
              ＋ 新しい記録
            </button>
          </div>
          {loading ? (
            <LoadingState />
          ) : timeline.length ? (
            <div className="list">
              {timeline.map(({ kind, item }) => (
                kind === "entry" ? (
                  <Card key={`entry-${item.id}`} entry={item} onClick={() => void detail(item.id)} />
                ) : (
                  <TimelinePurchaseCard key={`purchase-${item.id}`} purchase={item} onClick={() => { setSelectedPurchaseId(item.id); setPage("purchases"); }} />
                )
              ))}
            </div>
          ) : (
            <EmptyState>
              まだ記録はありません。最初の一件を書いてみましょう。
            </EmptyState>
          )}
        </>
      )}
      {page === "detail" && entry && (
        <section>
          <div className="actions">
            <button onClick={() => setPage("list")}>← 一覧へ</button>
            <span>
              <button onClick={edit}>編集</button>
              <button className="danger" onClick={() => setDeleteTarget("entry")}>
                削除
              </button>
            </span>
          </div>
          <EntryView
            entry={entry}
          onRemoveImage={(id) => setDeleteTarget(id)}
          />
          <p className="right">
            <button className="primary" onClick={edit}>
              編集する
            </button>
          </p>
        </section>
      )}
      {page === "form" && (
        <FormView
          form={form}
          tags={tags}
          purchases={purchases}
          editing={Boolean(editing)}
          saving={saving}
          setForm={setForm}
          save={(event) => void save(event)}
          cancel={() => setPage(editing ? "detail" : "list")}
        />
      )}
      {page === "settings" && (
        <SettingsView
          theme={theme}
          imageRootPath={imageRootPath}
          saving={saving}
          tags={tags}
          tagName={tagName}
          setImageRootPath={setImageRootPath}
          setTagName={setTagName}
          selectTheme={(nextTheme) => void changeTheme(nextTheme)}
          saveImageRootPath={() => void saveImageRootPath()}
          addTag={() => void addTag()}
        />
      )}
      {page === "search" && <SearchPage onEntry={(id) => void detail(id)} onPurchase={(id) => { setSelectedPurchaseId(id); setPage("purchases"); }} />}
      {page === "purchases" && <PurchasesPage onBack={() => setPage("list")} initialPurchaseId={selectedPurchaseId} onPurchaseOpened={() => setSelectedPurchaseId(null)} startCreating={startPurchaseCreate} onCreateStarted={() => setStartPurchaseCreate(false)} />}
      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget === "entry" ? "記録を削除しますか？" : "画像を削除しますか？"}
        description={deleteTarget === "entry" ? "この操作は元に戻せません。" : "この画像は元に戻せません。"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const target = deleteTarget;
          setDeleteTarget(null);
          if (target === "entry") void remove();
          else if (target) void removeImage(target);
        }}
      />
    </main>
  );
}
function SettingsView({
  theme,
  imageRootPath,
  saving,
  tags,
  tagName,
  setImageRootPath,
  setTagName,
  selectTheme,
  saveImageRootPath,
  addTag,
}: {
  theme: Theme;
  imageRootPath: string;
  saving: boolean;
  tags: Tag[];
  tagName: string;
  setImageRootPath: (value: string) => void;
  setTagName: (value: string) => void;
  selectTheme: (theme: Theme) => void;
  saveImageRootPath: () => void;
  addTag: () => void;
}) {
  const themes: { id: Theme; label: string }[] = [
    { id: "light", label: "Light" },
    { id: "dark", label: "Dark" },
    { id: "capture", label: "Capture" },
  ];
  return (
    <section>
      <div className="heading">
        <div>
          <small>Settings</small>
          <h1>設定</h1>
        </div>
      </div>
      <div className="settings-panel">
        <section className="settings-section" aria-labelledby="storage-heading">
          <div>
            <small>ストレージ</small>
            <h2 id="storage-heading">画像保存先</h2>
          </div>
          <label>
            image.root_path
            <input
              value={imageRootPath}
              maxLength={1024}
              onChange={(event) => setImageRootPath(event.target.value)}
              placeholder="C:/monolog/images"
            />
          </label>
          <div className="right">
            <button
              className="primary"
              disabled={saving || !imageRootPath.trim()}
              onClick={saveImageRootPath}
            >
              {saving ? "保存中…" : "保存する"}
            </button>
          </div>
        </section>
        <section
          className="settings-section"
          aria-labelledby="appearance-heading"
        >
          <div>
            <small>外観</small>
            <h2 id="appearance-heading">テーマ</h2>
          </div>
          <div className="theme-choices" role="radiogroup" aria-label="テーマ">
            {themes.map(({ id, label }) => (
              <label className="theme-choice" key={id} data-preview-theme={id}>
                <input
                  type="radio"
                  name="theme"
                  value={id}
                  checked={theme === id}
                  onChange={() => selectTheme(id)}
                />
                <span className="theme-preview" aria-hidden="true">
                  <i />
                  <b />
                </span>
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>
        <section className="settings-section" aria-labelledby="tags-heading">
          <div>
            <small>マスタ</small>
            <h2 id="tags-heading">タグ</h2>
          </div>
          <form
            className="newtag"
            onSubmit={(event) => {
              event.preventDefault();
              addTag();
            }}
          >
            <label className="sr-only" htmlFor="new-tag-name">
              新しいタグ
            </label>
            <input
              id="new-tag-name"
              value={tagName}
              maxLength={100}
              onChange={(event) => setTagName(event.target.value)}
              placeholder="新しいタグ"
            />
            <button type="submit" disabled={saving || !tagName.trim()}>
              追加
            </button>
          </form>
          {tags.length ? (
            <div className="tags" aria-label="登録済みタグ">
              {tags.map((tag) => (
                <span key={tag.id}>#{tag.name}</span>
              ))}
            </div>
          ) : (
            <small>登録済みのタグはありません。</small>
          )}
        </section>
      </div>
    </section>
  );
}
function Meta({ entry }: { entry: Entry }) {
  const EmotionIcon = entry.emotion ? icon(emotions, entry.emotion) : null;
  const WeatherIcon = entry.weather ? icon(weather, entry.weather) : null;

  return (
    <div className="meta">
      {entry.emotion && (
        <span
          className="meta-icon"
          aria-label={label(emotions, entry.emotion)}
          title={label(emotions, entry.emotion)}
        >
          {EmotionIcon && createElement(EmotionIcon, { "aria-hidden": true })}
        </span>
      )}
      {entry.weather && (
        <span
          className="meta-icon"
          aria-label={label(weather, entry.weather)}
          title={label(weather, entry.weather)}
        >
          {WeatherIcon && createElement(WeatherIcon, { "aria-hidden": true })}
        </span>
      )}
      {entry.location && <span>⌖ {entry.location}</span>}
    </div>
  );
}
function Tags({ entry }: { entry: Entry }) {
  return (
    <div className="tags">
      {entry.entryTags.map((relation) => (
        <span key={relation.id}>#{relation.tag.name}</span>
      ))}
    </div>
  );
}
function CreateMenu({ onSelect }: { onSelect: (kind: CreateKind) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);
  const select = (kind: CreateKind) => {
    close();
    onSelect(kind);
  };
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);
  return (
    <div className="create-menu" ref={containerRef}>
      {open && <button type="button" className="create-overlay" aria-label="作成メニューを閉じる" onClick={close} />}
      <div className={`create-dropdown${open ? " open" : ""}`} role="menu" aria-label="作成メニュー">
        <button type="button" className="create-purchase" role="menuitem" onClick={() => select("purchase")}>
          <ShoppingBag aria-hidden="true" />購入記録
        </button>
        <button type="button" className="create-entry" role="menuitem" onClick={() => select("entry")}>
          <FileText aria-hidden="true" />記録
        </button>
      </div>
      <button type="button" className="create-trigger primary" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className="create-trigger-label"><Plus aria-hidden="true" /> 作成 <span aria-hidden="true">▼</span></span>
        <span className="create-fab-icon" aria-hidden="true">{open ? <X /> : <Plus />}</span>
        <span className="sr-only">{open ? "作成メニューを閉じる" : "作成メニューを開く"}</span>
      </button>
    </div>
  );
}
function TimelinePurchaseCard({ purchase, onClick }: { purchase: Purchase; onClick: () => void }) {
  return (
    <article className="card timeline-purchase-card">
      <button onClick={onClick}>
        <time>{purchase.purchasedAt}</time>
        <p>{purchase.name}</p>
        <div className="meta"><span>{purchase.purchaseCategory.name}</span><span>¥{purchase.price.toLocaleString("ja-JP")}</span>{purchase.shop && <span>{purchase.shop}</span>}</div>
      </button>
    </article>
  );
}
function Card({ entry, onClick }: { entry: Entry; onClick: () => void }) {
  return (
    <article className="card">
      <button onClick={onClick}>
        <time>{format(entry.recordedAt)}</time>
        <p>{entry.content}</p>
        {entry.images.length > 0 && (
          <div className="thumbs">
            {entry.images.slice(0, 4).map((image) => (
              <img
                key={image.id}
                src={api.entries.imageUrl(entry.id, image.id)}
                alt=""
              />
            ))}
          </div>
        )}
        <Meta entry={entry} />
        <Tags entry={entry} />
      </button>
    </article>
  );
}
function EntryView({
  entry,
  onRemoveImage,
}: {
  entry: Entry;
  onRemoveImage: (id: string) => void;
}) {
  return (
    <article className="detail">
      <time>{format(entry.recordedAt)}</time>
      <p>{entry.content}</p>
      {entry.images.length > 0 && (
        <div className="images">
          {entry.images.map((image) => (
            <figure key={image.id}>
              <img
                src={api.entries.imageUrl(entry.id, image.id)}
                alt={image.originalFileName}
              />
              <button
                className="danger"
                onClick={() => onRemoveImage(image.id)}
              >
                画像を削除
              </button>
            </figure>
          ))}
        </div>
      )}
      <Meta entry={entry} />
      <Tags entry={entry} />
      {entry.entryPurchases.length > 0 && (
        <div className="related-records">
          <strong>関連する購入記録</strong>
          {entry.entryPurchases.map((relation) => (
            <span key={relation.id}>{relation.purchase.name}</span>
          ))}
        </div>
      )}
    </article>
  );
}
function IconChoiceButton<T extends string>({
  choice,
  selected,
  onClick,
}: {
  choice: IconChoice<T>;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = choice.icon;

  return (
    <button
      type="button"
      className={selected ? "selected" : ""}
      aria-label={choice.label}
      aria-pressed={selected}
      onClick={onClick}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}
function FormView({
  form,
  tags,
  purchases,
  editing,
  saving,
  setForm,
  save,
  cancel,
}: {
  form: Form;
  tags: Tag[];
  purchases: Purchase[];
  editing: boolean;
  saving: boolean;
  setForm: (value: Form | ((current: Form) => Form)) => void;
  save: (event: FormEvent) => void;
  cancel: () => void;
}) {
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    if (!editing && form.content.trim()) {
      const { files: _files, ...draft } = form;
      sessionStorage.setItem("monolog.entry-draft", JSON.stringify(draft));
    }
  }, [editing, form]);
  return (
    <section>
      <div className="heading">
        <div>
          <small>Entry</small>
          <h1>{editing ? "記録を編集" : "新しい記録"}</h1>
        </div>
      </div>
      <form onSubmit={save}>
        <label>
          本文
          <textarea
            required
            maxLength={10000}
            autoFocus
            value={form.content}
            onChange={(event) => set("content", event.target.value)}
            placeholder="今のこと、残したいことを書いてください"
          />
        </label>
        <details className="optional-fields">
          <summary>日時・場所・気分などを追加</summary>
          <div className="optional-content">
        <div className="grid">
          <label>
            記録日時
            <input
              required
              type="datetime-local"
              value={dateTime(new Date(form.recordedAt))}
              onChange={(event) =>
                set("recordedAt", new Date(event.target.value).toISOString())
              }
            />
          </label>
          <label>
            場所
            <input
              maxLength={255}
              value={form.location ?? ""}
              onChange={(event) => set("location", event.target.value)}
              placeholder="例：自宅、東京駅"
            />
          </label>
        </div>
        <div className="selection-row">
          <fieldset className="icon-picker emotion-picker">
            <legend>感情</legend>
            <div className="icon-choices" role="radiogroup" aria-label="感情">
              {emotions.map((choice) => (
                <IconChoiceButton
                  key={choice.id}
                  choice={choice}
                  selected={form.emotion === choice.id}
                  onClick={() =>
                    set(
                      "emotion",
                      form.emotion === choice.id ? null : choice.id,
                    )
                  }
                />
              ))}
            </div>
          </fieldset>
          <fieldset className="icon-picker weather-picker">
            <legend>天気</legend>
            <div className="icon-choices" role="radiogroup" aria-label="天気">
              {weather.map((choice) => (
                <IconChoiceButton
                  key={choice.id}
                  choice={choice}
                  selected={form.weather === choice.id}
                  onClick={() =>
                    set(
                      "weather",
                      form.weather === choice.id ? null : choice.id,
                    )
                  }
                />
              ))}
            </div>
          </fieldset>
        </div>
        <fieldset className="tag-picker">
          <legend>
            <span aria-hidden="true">🏷</span> タグ
          </legend>
          <div className="tag-choices">
            {tags.map((tag) => (
              <label className="tag-choice" key={tag.id}>
                <input
                  type="checkbox"
                  checked={form.tagIds.includes(tag.id)}
                  onChange={() =>
                    set(
                      "tagIds",
                      form.tagIds.includes(tag.id)
                        ? form.tagIds.filter((id) => id !== tag.id)
                        : [...form.tagIds, tag.id],
                    )
                  }
                />
                <span aria-hidden="true">🏷</span> #{tag.name}
              </label>
            ))}
          </div>
        </fieldset>
        <PurchasePicker
          purchases={purchases}
          selectedIds={form.purchaseIds}
          onChange={(purchaseIds) => set("purchaseIds", purchaseIds)}
        />
          </div>
        </details>
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
        <ImageFilePreview files={form.files} />
        </label>
        <div className="actions">
          <button type="button" onClick={() => {
            if (!editing && form.content.trim() && !confirm("入力内容は下書きとして保持されます。キャンセルしますか？")) return;
            cancel();
          }}>
            キャンセル
          </button>
          <button className="primary" disabled={saving}>
            {saving ? "保存中…" : editing ? "更新する" : "保存する"}
          </button>
        </div>
      </form>
    </section>
  );
}

function PurchasePicker({
  purchases,
  selectedIds,
  onChange,
}: {
  purchases: Purchase[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("ja-JP");
  const matches = purchases.filter((purchase) =>
    purchase.name.toLocaleLowerCase("ja-JP").includes(normalizedQuery),
  );
  const toggle = (id: string) =>
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    );

  return (
    <fieldset className="purchase-picker">
      <legend>関連する購入記録</legend>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="購入記録を検索"
        aria-label="購入記録を検索"
      />
      <div className="purchase-choices">
        {matches.map((purchase) => (
          <label className="purchase-choice" key={purchase.id}>
            <input
              type="checkbox"
              checked={selectedIds.includes(purchase.id)}
              onChange={() => toggle(purchase.id)}
            />
            <span>{purchase.name}</span>
            <small>{purchase.purchasedAt}</small>
          </label>
        ))}
        {matches.length === 0 && <small>該当する購入記録はありません。</small>}
      </div>
    </fieldset>
  );
}
export default App;
