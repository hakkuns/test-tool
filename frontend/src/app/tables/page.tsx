"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TablesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/scenarios");
  }, [router]);

  return (
    <div className="container mx-auto py-8 text-center">
      <p className="text-muted-foreground">
        シナリオページにリダイレクトしています...
      </p>
    </div>
  );
}
