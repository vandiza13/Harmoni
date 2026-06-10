import type { Metadata } from "next";
import { getDocuments } from "@/actions/modules";
import { DocumentsList } from "@/components/documents/documents-list";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Brankas Dokumen",
  description: "Penyimpanan dokumen penting keluarga Anda secara digital.",
};

export default async function DokumenPage() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { familyId?: string };
  if (!user.familyId) return null;

  const docs = await getDocuments();

  return <DocumentsList initialDocuments={docs as any} />;
}
