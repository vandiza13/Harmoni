import type { Metadata } from "next";

export const metadata: Metadata = { title: "Keluarga" };

export default function KeluargaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground capitalize">keluarga</h2>
        <p className="text-sm text-muted-foreground">Halaman sedang dikembangkan</p>
      </div>
      <div className="card-harmoni p-8 text-center text-muted-foreground">
        <p className="text-4xl mb-3">🚧</p>
        <p className="font-medium">Segera hadir</p>
        <p className="text-sm mt-1">Fitur lengkap akan segera tersedia</p>
      </div>
    </div>
  );
}
