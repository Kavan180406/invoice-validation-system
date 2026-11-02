
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function RouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (pathname === "/login") {
      if (token) {
        router.replace("/");
      } else {
        setReady(true);
      }
      return;
    }

    if (!token) {
      router.replace("/login");
      return;
    }

    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Checking authentication...
      </main>
    );
  }

  return <>{children}</>;
}
