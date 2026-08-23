import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  api,
  type Emotion,
  type Entry,
  type EntryInput,
  type Theme,
  type Tag,
  type Weather,
} from "./api";
import "./App.css";

const emotions: [Emotion, string][] = [
  ["very_happy", "とても嬉しい"],
  ["happy", "嬉しい"],
  ["neutral", "ふつう"],
  ["sad", "悲しい"],
  ["very_sad", "とても悲しい"],
  ["angry", "怒り"],
  ["anxious", "不安"],
  ["tired", "疲れた"],
  ["excited", "わくわく"],
];
const weather: [Weather, string][] = [
  ["sunny", "晴れ"],
  ["cloudy", "くもり"],
  ["rainy", "雨"],
  ["snowy", "雪"],
];
const label = (pairs: [string, string][], value: string | null) =>
  pairs.find(([id]) => id === value)?.[1];
const dateTime = (date = new Date()) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
const format = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
type Form = EntryInput & { tagIds: string[]; files: File[] };
const emptyForm = (): Form => ({
  content: "",
  recordedAt: new Date().toISOString(),
  emotion: null,
  weather: null,
  location: null,
  tagIds: [],
  files: [],
});

function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [page, setPage] = useState<"list" | "detail" | "form" | "settings">(
    "list",
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tagName, setTagName] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const [imageRootPath, setImageRootPath] = useState("");
  const fail = (reason: unknown) =>
    setError(reason instanceof Error ? reason.message : "操作に失敗しました。");
  const reload = async () => {
    setLoading(true);
    try {
      const [nextEntries, nextTags, settings] = await Promise.all([
        api.entries.list(),
        api.tags.list(),
        api.settings.list(),
      ]);
      setEntries(nextEntries);
      setTags(nextTags);
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
    setForm(emptyForm());
    setError("");
    setPage("form");
  };
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
      ]);
      if (form.files.length)
        await api.entries.uploadImages(saved.id, form.files);
      setEntry(await api.entries.get(saved.id));
      await reload();
      setPage("detail");
    } catch (reason) {
      fail(reason);
    } finally {
      setSaving(false);
    }
  };
  const addTag = async () => {
    if (!tagName.trim()) return;
    try {
      const tag = await api.tags.create(tagName.trim());
      setTags((current) => [...current, tag]);
      setForm((current) => ({
        ...current,
        tagIds: [...current.tagIds, tag.id],
      }));
      setTagName("");
    } catch (reason) {
      fail(reason);
    }
  };
  const remove = async () => {
    if (!entry || !confirm("この記録を削除します。元に戻せません。")) return;
    try {
      await api.entries.remove(entry.id);
      setPage("list");
      setEntry(null);
      await reload();
    } catch (reason) {
      fail(reason);
    }
  };
  const removeImage = async (id: string) => {
    if (!entry || !confirm("この画像を削除しますか？")) return;
    try {
      await api.entries.removeImage(entry.id, id);
      setEntry(await api.entries.get(entry.id));
      await reload();
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
          <button onClick={() => setPage("settings")}>Settings</button>
          <button className="primary" onClick={create}>
            記録する
          </button>
        </div>
      </header>
      {error && (
        <div className="error" role="alert">
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}
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
            <p className="state">読み込み中…</p>
          ) : entries.length ? (
            <div className="list">
              {entries.map((item) => (
                <Card
                  key={item.id}
                  entry={item}
                  onClick={() => void detail(item.id)}
                />
              ))}
            </div>
          ) : (
            <p className="state">
              まだ記録はありません。最初の一件を書いてみましょう。
            </p>
          )}
        </>
      )}
      {page === "detail" && entry && (
        <section>
          <div className="actions">
            <button onClick={() => setPage("list")}>← 一覧へ</button>
            <span>
              <button onClick={edit}>編集</button>
              <button className="danger" onClick={() => void remove()}>
                削除
              </button>
            </span>
          </div>
          <EntryView
            entry={entry}
            onRemoveImage={(id) => void removeImage(id)}
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
          editing={Boolean(editing)}
          saving={saving}
          tagName={tagName}
          setTagName={setTagName}
          setForm={setForm}
          addTag={() => void addTag()}
          save={(event) => void save(event)}
          cancel={() => setPage(editing ? "detail" : "list")}
        />
      )}
      {page === "settings" && (
        <SettingsView
          theme={theme}
          imageRootPath={imageRootPath}
          saving={saving}
          setImageRootPath={setImageRootPath}
          selectTheme={(nextTheme) => void changeTheme(nextTheme)}
          saveImageRootPath={() => void saveImageRootPath()}
        />
      )}
    </main>
  );
}
function SettingsView({
  theme,
  imageRootPath,
  saving,
  setImageRootPath,
  selectTheme,
  saveImageRootPath,
}: {
  theme: Theme;
  imageRootPath: string;
  saving: boolean;
  setImageRootPath: (value: string) => void;
  selectTheme: (theme: Theme) => void;
  saveImageRootPath: () => void;
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
      </div>
    </section>
  );
}
function Meta({ entry }: { entry: Entry }) {
  return (
    <div className="meta">
      {entry.emotion && <span>{label(emotions, entry.emotion)}</span>}
      {entry.weather && <span>{label(weather, entry.weather)}</span>}
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
function Card({ entry, onClick }: { entry: Entry; onClick: () => void }) {
  return (
    <article className="card">
      <button onClick={onClick}>
        <time>{format(entry.recordedAt)}</time>
        <p>{entry.content}</p>
        <Meta entry={entry} />
        <Tags entry={entry} />
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
      <Meta entry={entry} />
      <Tags entry={entry} />
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
    </article>
  );
}
function FormView({
  form,
  tags,
  editing,
  saving,
  tagName,
  setTagName,
  setForm,
  addTag,
  save,
  cancel,
}: {
  form: Form;
  tags: Tag[];
  editing: boolean;
  saving: boolean;
  tagName: string;
  setTagName: (value: string) => void;
  setForm: (value: Form | ((current: Form) => Form)) => void;
  addTag: () => void;
  save: (event: FormEvent) => void;
  cancel: () => void;
}) {
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
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
            感情
            <select
              value={form.emotion ?? ""}
              onChange={(event) =>
                set("emotion", (event.target.value || null) as Emotion | null)
              }
            >
              <option value="">選択しない</option>
              {emotions.map(([id, name]) => (
                <option value={id} key={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            天気
            <select
              value={form.weather ?? ""}
              onChange={(event) =>
                set("weather", (event.target.value || null) as Weather | null)
              }
            >
              <option value="">選択しない</option>
              {weather.map(([id, name]) => (
                <option value={id} key={id}>
                  {name}
                </option>
              ))}
            </select>
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
        <fieldset>
          <legend>タグ</legend>
          <div className="choices">
            {tags.map((tag) => (
              <label key={tag.id}>
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
                #{tag.name}
              </label>
            ))}
          </div>
          <div className="newtag">
            <input
              value={tagName}
              maxLength={255}
              onChange={(event) => setTagName(event.target.value)}
              placeholder="新しいタグ"
            />
            <button type="button" onClick={addTag}>
              追加
            </button>
          </div>
        </fieldset>
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
          <button className="primary" disabled={saving}>
            {saving ? "保存中…" : editing ? "更新する" : "保存する"}
          </button>
        </div>
      </form>
    </section>
  );
}
export default App;
