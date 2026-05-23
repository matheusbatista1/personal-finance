"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { removeAvatar, uploadAvatar } from "@/actions/profile";
import { cn } from "@/lib/utils";

interface Props {
  currentUrl: string | null;
  initial: string;
  displayName: string;
}

export function AvatarUploader({ currentUrl, initial, displayName }: Props) {
  const [optimisticUrl, setOptimisticUrl] = useState<string | null>(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(file: File | null) {
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.append("avatar", file);
    // Optimistic preview using object URL while the upload runs.
    const previewUrl = URL.createObjectURL(file);
    setOptimisticUrl(previewUrl);

    startTransition(async () => {
      const result = await uploadAvatar(formData);
      URL.revokeObjectURL(previewUrl);
      if (!result.ok) {
        setError(result.error);
        setOptimisticUrl(currentUrl);
        return;
      }
      setOptimisticUrl(result.avatarUrl ?? null);
    });
  }

  function onRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeAvatar();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOptimisticUrl(null);
    });
  }

  return (
    <div className="gap-sm flex flex-col items-center">
      <div className="relative">
        <Avatar src={optimisticUrl} alt={displayName} initial={initial} size={72} />
        {pending ? (
          <span
            aria-hidden
            className="bg-background/70 absolute inset-0 flex items-center justify-center rounded-full"
          >
            <Spinner size="sm" />
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Trocar foto"
          disabled={pending}
          className={cn(
            "bg-primary text-on-primary border-surface absolute -right-1 -bottom-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 shadow-md transition-all",
            "hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <Camera size={14} aria-hidden />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      {optimisticUrl ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={pending}
          className="text-label-sm text-on-surface-variant hover:text-error gap-xs flex cursor-pointer items-center font-mono transition-colors disabled:opacity-60"
        >
          <Trash2 size={12} aria-hidden />
          Remover
        </button>
      ) : null}
      {error ? (
        <p className="text-label-sm text-error font-mono" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
