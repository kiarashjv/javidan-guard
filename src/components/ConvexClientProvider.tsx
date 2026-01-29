"use client";

import { ConvexProvider, ConvexReactClient, useMutation } from "convex/react";
import { useEffect, useMemo } from "react";
import { api } from "@/lib/convex-api";
import { getFingerprint } from "@/lib/fingerprint";
import { getClientMeta, getSessionId, storeFingerprint } from "@/lib/session";

type ConvexClientProviderProps = {
  children: React.ReactNode;
};

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set.");
  }

  const client = useMemo(() => new ConvexReactClient(convexUrl), [convexUrl]);

  return (
    <ConvexProvider client={client}>
      <SessionBootstrap>{children}</SessionBootstrap>
    </ConvexProvider>
  );
}

function SessionBootstrap({ children }: ConvexClientProviderProps) {
  const upsertSession = useMutation(api.sessions.upsert);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const sessionId = getSessionId();
      const fingerprint = await getFingerprint();
      const clientMeta = getClientMeta();

      if (cancelled) {
        return;
      }

      storeFingerprint(fingerprint);

      await upsertSession({
        sessionId,
        fingerprint,
        ipHash: clientMeta.ipHash,
        userAgent: clientMeta.userAgent,
      });
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [upsertSession]);

  return <>{children}</>;
}
