"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/client";

const STORAGE_KEY = "atelier_wishlist";

type WishlistContextValue = {
  ids: string[];
  hydrated: boolean;
  isLiked: (productId: string) => boolean;
  toggle: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readGuestWishlist() {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const utils = trpc.useUtils();
  const [guestIds, setGuestIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const list = trpc.wishlist.list.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setGuestIds(readGuestWishlist());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const sync = trpc.wishlist.sync.useMutation({
    onSuccess: (ids) => {
      utils.wishlist.list.setData(undefined, ids);
      window.localStorage.removeItem(STORAGE_KEY);
      setGuestIds([]);
    },
  });

  useEffect(() => {
    if (
      hydrated &&
      status === "authenticated" &&
      guestIds.length > 0 &&
      !sync.isPending
    ) {
      sync.mutate({ productIds: guestIds });
    }
  }, [guestIds, hydrated, status, sync]);

  const toggleMutation = trpc.wishlist.toggle.useMutation({
    onMutate: async ({ productId, liked }) => {
      await utils.wishlist.list.cancel();
      const previous = utils.wishlist.list.getData();
      utils.wishlist.list.setData(undefined, (current = []) =>
        liked
          ? [productId, ...current.filter((id) => id !== productId)]
          : current.filter((id) => id !== productId)
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      utils.wishlist.list.setData(undefined, context?.previous);
    },
    onSettled: () => utils.wishlist.list.invalidate(),
  });

  const ids = useMemo(
    () =>
      status === "authenticated"
        ? [...new Set([...(list.data ?? []), ...guestIds])]
        : guestIds,
    [guestIds, list.data, status]
  );

  const toggle = useCallback(
    (productId: string) => {
      const liked = ids.includes(productId);
      if (status === "authenticated") {
        toggleMutation.mutate({ productId, liked: !liked });
        return;
      }
      setGuestIds((current) => {
        const next = current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [productId, ...current];
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [ids, status, toggleMutation]
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      hydrated,
      isLiked: (productId) => ids.includes(productId),
      toggle,
    }),
    [hydrated, ids, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist must be used within WishlistProvider");
  return value;
}
