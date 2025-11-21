"use client";

import { Database, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-end gap-4">
          <p>API testing and database management tool for development teams</p>
        </div>
      </div>
    </footer>
  );
}
