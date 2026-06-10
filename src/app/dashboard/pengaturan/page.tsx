import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { getFamilyDetails } from "@/actions/family";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Pengaturan",
  description: "Kelola profil pribadi dan pengaturan keluarga Anda.",
};

export default async function PengaturanPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Fetch user profile
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
  });

  if (!user) return null;

  // Fetch family details
  const familyDetails = await getFamilyDetails();

  // Determine current user's role in the family
  let currentUserRole: "OWNER" | "ADMIN" | "MEMBER" | "CHILD" = "MEMBER";
  if (familyDetails) {
    const member = familyDetails.members.find((m) => m.userId === user.id);
    if (member) {
      currentUserRole = member.role;
    }
  }

  // Format date fields to avoid Next.js serialization warnings
  const serializedFamilyDetails = familyDetails
    ? {
        ...familyDetails,
        members: familyDetails.members.map((m) => ({
          ...m,
          joinedAt: new Date(m.joinedAt),
          user: {
            ...m.user,
          },
        })),
      }
    : null;

  return (
    <SettingsView
      userProfile={user}
      familyDetails={serializedFamilyDetails as any}
      currentUserId={user.id}
      currentUserRole={currentUserRole}
    />
  );
}
