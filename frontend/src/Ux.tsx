import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export function LoadingState({ label = "読み込み中…" }: { label?: string }) {
  return <p className="state loading-state" role="status">{label}</p>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="state empty-state">{children}</p>;
}

export function Notice({
  kind,
  children,
  onClose,
}: {
  kind: "error" | "success";
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className={`notice ${kind}`} role={kind === "error" ? "alert" : "status"}>
      <span>{children}</span>
      <button type="button" aria-label="閉じる" onClick={onClose}>×</button>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "削除する",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title">{title}</h2>
        <p>{description}</p>
        <div className="dialog-actions">
          <button type="button" onClick={onCancel}>キャンセル</button>
          <button type="button" className="danger-button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

export function ImageFilePreview({ files }: { files: File[] }) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const nextUrls = files.map((file) => URL.createObjectURL(file));
    setUrls(nextUrls);
    return () => nextUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);
  if (!files.length) return null;
  return (
    <div className="file-preview" aria-label="選択した画像のプレビュー">
      {files.map((file, index) => (
        <figure key={`${file.name}-${file.lastModified}`}>
          <img src={urls[index]} alt={file.name} />
          <figcaption>{file.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}
