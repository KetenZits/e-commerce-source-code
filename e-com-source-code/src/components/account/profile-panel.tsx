"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrivacyActions } from "@/components/legal/privacy-actions";
import { useI18n } from "@/components/i18n/locale-provider";
import { localeTag } from "@/lib/i18n/config";
import { StatusChip } from "@/components/ui/status-chip";
import { trpc } from "@/trpc/client";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
  role: string;
  createdAt: Date;
  hasPassword: boolean;
};

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "A").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

export function ProfilePanel({
  profile,
  orderCount,
  addressCount,
}: {
  profile: Profile;
  orderCount: number;
  addressCount: number;
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { update } = useSession();
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const imageSrc = preview === "" ? null : (preview ?? profile.image);
  const save = trpc.auth.updateProfile.useMutation({
    onSuccess: async (user) => {
      toast.message(t("profile.savedToast"));
      await update({ name: user.name });
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => toast.message(t("profile.passwordUpdated")),
    onError: (error) => toast.error(error.message),
  });
  const setPassword = trpc.auth.setPassword.useMutation({
    onSuccess: () => {
      toast.message(t("profile.passwordSet"));
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const resend = trpc.auth.resendVerification.useMutation({
    onSuccess: () => toast.message(t("profile.verifySent")),
    onError: (error) => toast.error(error.message),
  });

  const joined = new Date(profile.createdAt).toLocaleDateString(localeTag(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function refreshPhoto(image: string | null) {
    await update({ image });
    router.refresh();
  }

  async function onPickPhoto(file: File | undefined) {
    if (!file) return;
    const local = URL.createObjectURL(file);
    setPreview(local);
    setUploading(true);
    try {
      const data = new FormData();
      data.set("file", file);
      const response = await fetch("/api/account/avatar", { method: "POST", body: data });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        throw new Error(result.error ?? t("profile.uploadFailed"));
      }
      toast.message(t("profile.photoUpdated"));
      URL.revokeObjectURL(local);
      setPreview(result.url);
      await refreshPhoto(result.url);
    } catch (error) {
      URL.revokeObjectURL(local);
      setPreview(null);
      toast.error(error instanceof Error ? error.message : t("profile.uploadFailed"));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function removePhoto() {
    setUploading(true);
    try {
      const response = await fetch("/api/account/avatar", { method: "DELETE" });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? t("profile.removePhoto"));
      }
      setPreview("");
      toast.message(t("profile.photoRemoved"));
      await refreshPhoto(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("profile.removePhoto"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="group relative size-20 shrink-0 overflow-hidden rounded-full ring-1 ring-border focus-visible:ring-2 focus-visible:ring-ring/40"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
              aria-label={t("profile.changePhoto")}
            >
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageSrc} alt="" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center bg-muted font-display text-2xl text-primary">
                  {initials(profile.name, profile.email)}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-foreground/45 text-xs tracking-[0.12em] text-primary-foreground uppercase opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Camera className="size-4" />
              </span>
            </button>
            <div className="space-y-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => void onPickPhoto(event.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
              >
                {uploading ? t("profile.uploading") : t("profile.changePhoto")}
              </Button>
              {imageSrc ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading}
                  onClick={() => void removePhoto()}
                >
                  {t("profile.remove")}
                </Button>
              ) : null}
              <p className="text-xs text-muted-foreground">{t("profile.photoHint")}</p>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display truncate text-3xl">{profile.name || t("profile.yourProfile")}</h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">{profile.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusChip tone={profile.emailVerified ? "forest" : "brass"}>
                {profile.emailVerified ? t("profile.emailVerified") : t("profile.emailUnverified")}
              </StatusChip>
              {profile.role !== "BUYER" ? (
                <StatusChip tone="muted">{profile.role.replaceAll("_", " ").toLowerCase()}</StatusChip>
              ) : null}
            </div>
          </div>
        </div>
        <div className="grid border-t border-border sm:grid-cols-3">
          <Stat label={t("profile.memberSince")} value={joined} />
          <Stat label={t("profile.orders")} value={String(orderCount)} />
          <Stat label={t("profile.savedAddresses")} value={String(addressCount)} />
        </div>
      </section>

      {!profile.emailVerified ? (
        <section className="rounded-2xl border border-brass/30 bg-card p-5">
          <p className="text-sm leading-6 text-muted-foreground">
            {t("profile.confirmEmail")}
          </p>
          <Button
            className="mt-3"
            type="button"
            variant="outline"
            size="sm"
            disabled={resend.isPending}
            onClick={() => resend.mutate()}
          >
            {resend.isPending ? t("profile.sending") : t("profile.resend")}
          </Button>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">{t("profile.displayName")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("profile.nameHint")}</p>
        <form
          className="mt-5 max-w-md space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const name = String(new FormData(event.currentTarget).get("name") ?? "");
            save.mutate({ name });
          }}
        >
          <div>
            <Label htmlFor="profile-name">{t("auth.name")}</Label>
            <Input
              id="profile-name"
              name="name"
              className="mt-1.5"
              defaultValue={profile.name ?? ""}
              minLength={2}
              maxLength={80}
              required
            />
          </div>
          <div>
            <Label htmlFor="profile-email">{t("auth.email")}</Label>
            <Input id="profile-email" className="mt-1.5" value={profile.email} readOnly />
          </div>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? t("profile.saving") : t("profile.saveName")}
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">{profile.hasPassword ? t("profile.password") : t("profile.setPasswordTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile.hasPassword ? t("profile.passwordHint") : t("profile.socialHint")}
        </p>
        {profile.hasPassword ? (
          <form
            className="mt-5 max-w-md space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              changePassword.mutate({
                currentPassword: String(data.get("currentPassword") ?? ""),
                password: String(data.get("password") ?? ""),
              });
              event.currentTarget.reset();
            }}
          >
            <div>
              <Label htmlFor="current-password">{t("profile.current")}</Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                className="mt-1.5"
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <Label htmlFor="new-password">{t("profile.newPassword")}</Label>
              <Input
                id="new-password"
                name="password"
                type="password"
                className="mt-1.5"
                autoComplete="new-password"
                minLength={10}
                required
              />
            </div>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? t("profile.updating") : t("profile.updatePassword")}
            </Button>
          </form>
        ) : (
          <form
            className="mt-5 max-w-md space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const password = String(new FormData(event.currentTarget).get("password") ?? "");
              setPassword.mutate({ password });
              event.currentTarget.reset();
            }}
          >
            <div>
              <Label htmlFor="set-password">{t("profile.newPassword")}</Label>
              <Input
                id="set-password"
                name="password"
                type="password"
                className="mt-1.5"
                autoComplete="new-password"
                minLength={10}
                required
              />
            </div>
            <Button type="submit" disabled={setPassword.isPending}>
              {setPassword.isPending ? t("profile.saving") : t("profile.setPassword")}
            </Button>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">{t("profile.privacy")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("profile.privacyHint")}
        </p>
        <PrivacyActions />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border px-5 py-4 sm:border-r sm:last:border-r-0">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
