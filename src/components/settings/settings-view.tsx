"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Users,
  Copy,
  Check,
  Loader2,
  Save,
  Trash2,
  RefreshCw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  updateUserProfile,
  updateFamilyProfile,
  regenerateInviteCode,
  removeFamilyMember,
} from "@/actions/family";
import { toast } from "sonner";
import { getInitials, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
}

interface MemberDetail {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "CHILD";
  nickname: string | null;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface FamilyDetails {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  members: MemberDetail[];
}

interface SettingsViewProps {
  userProfile: UserProfile;
  familyDetails: FamilyDetails | null;
  currentUserId: string;
  currentUserRole: "OWNER" | "ADMIN" | "MEMBER" | "CHILD";
}

export function SettingsView({
  userProfile,
  familyDetails,
  currentUserId,
  currentUserRole,
}: SettingsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // User profile states
  const [userName, setUserName] = useState(userProfile.name || "");

  // Family profile states
  const [familyName, setFamilyName] = useState(familyDetails?.name || "");
  const [familyDesc, setFamilyDesc] = useState(familyDetails?.description || "");

  // Invite code states
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState(familyDetails?.inviteCode || "");
  const [regenerating, setRegenerating] = useState(false);

  // Member management states
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isFamilyOwnerOrAdmin = ["OWNER", "ADMIN"].includes(currentUserRole);
  const isFamilyOwner = currentUserRole === "OWNER";

  // ─── Actions ──────────────────────────────────────────────────
  function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!userName.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }

    startTransition(async () => {
      const res = await updateUserProfile(userName);
      if (res.success) {
        toast.success("Profil Anda berhasil diperbarui!");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui profil");
      }
    });
  }

  function handleUpdateFamily(e: React.FormEvent) {
    e.preventDefault();
    if (!familyName.trim()) {
      toast.error("Nama keluarga tidak boleh kosong");
      return;
    }

    startTransition(async () => {
      const res = await updateFamilyProfile(familyName, familyDesc || undefined);
      if (res.success) {
        toast.success("Informasi keluarga berhasil diperbarui!");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui informasi keluarga");
      }
    });
  }

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success("Kode undangan disalin ke papan klip!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    if (!confirm("Apakah Anda yakin ingin memperbarui kode undangan? Kode lama tidak akan bisa digunakan lagi.")) {
      return;
    }

    setRegenerating(true);
    try {
      const res = await regenerateInviteCode();
      if (res.success && res.data) {
        setInviteCode(res.data.code);
        toast.success("Kode undangan diperbarui!");
        router.refresh();
      } else {
        toast.error("Gagal memperbarui kode undangan");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setRegenerating(false);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!confirm(`Apakah Anda yakin ingin mengeluarkan ${memberName} dari keluarga?`)) {
      return;
    }

    setRemovingId(userId);
    try {
      const res = await removeFamilyMember(userId);
      if (res.success) {
        toast.success(`${memberName} berhasil dikeluarkan dari keluarga`);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mengeluarkan anggota");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Pengaturan</h2>
        <p className="text-sm text-muted-foreground">
          Kelola informasi profil pribadi dan setelan workspace keluarga Anda
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm h-11 bg-muted rounded-xl p-1">
          <TabsTrigger value="profile" className="rounded-lg gap-2 text-xs font-semibold">
            <UserIcon className="h-3.5 w-3.5" />
            Profil Saya
          </TabsTrigger>
          <TabsTrigger value="family" className="rounded-lg gap-2 text-xs font-semibold">
            <Users className="h-3.5 w-3.5" />
            Keluarga Saya
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB: USER PROFILE ───────────────────────────────────── */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Avatar Widget */}
            <div className="card-harmoni p-6 flex flex-col items-center justify-center text-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userProfile.image ?? undefined} />
                <AvatarFallback className="gradient-primary text-white text-3xl font-semibold">
                  {getInitials(userProfile.name || userProfile.email || "U")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-bold text-foreground text-base">
                  {userProfile.name || "Pengguna"}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">{userProfile.email}</p>
              </div>
              <Badge variant="outline" className="text-[10px] tracking-wide uppercase px-2 py-0.5">
                Role System: {userProfile.role}
              </Badge>
            </div>

            {/* Edit Form */}
            <div className="card-harmoni p-6 md:col-span-2">
              <h3 className="font-bold text-foreground text-base border-b border-border/50 pb-3 mb-4">
                Informasi Profil
              </h3>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="user-email">Alamat Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={userProfile.email}
                    disabled
                    className="h-11 bg-muted cursor-not-allowed text-muted-foreground"
                  />
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" /> Email login tidak dapat diubah
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="user-name">Nama Lengkap</Label>
                  <Input
                    id="user-name"
                    placeholder="Masukkan nama lengkap Anda"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    className="h-11 border-border"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    className="gradient-primary text-white font-semibold shadow-soft hover:shadow-soft-lg gap-2 h-10 px-5"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB: FAMILY SETTINGS ────────────────────────────────── */}
        <TabsContent value="family" className="mt-6">
          {!familyDetails ? (
            <div className="card-harmoni p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
              <p className="font-medium text-sm">Anda tidak tergabung dalam keluarga mana pun</p>
              <p className="text-xs mt-1">Harap buat atau gabung keluarga terlebih dahulu di alur penyiapan.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                {/* Invite Code Info Widget */}
                <div className="card-harmoni p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-foreground text-sm">Kode Undangan</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Gunakan kode ini untuk mengundang anggota keluarga lain
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted border border-border h-11 rounded-xl flex items-center justify-center font-mono font-bold tracking-widest text-foreground text-sm shadow-soft-sm">
                      {inviteCode}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyInviteCode}
                      className="h-11 w-11 p-0 shrink-0 border-border"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>

                  {isFamilyOwner && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleRegenerateCode}
                      disabled={regenerating}
                      className="w-full text-xs gap-1.5 h-9 text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", regenerating && "animate-spin")} />
                      Perbarui Kode Undangan
                    </Button>
                  )}
                </div>

                {/* Edit Family Info Form */}
                <div className="card-harmoni p-6 md:col-span-2">
                  <h3 className="font-bold text-foreground text-base border-b border-border/50 pb-3 mb-4">
                    Informasi Keluarga
                  </h3>
                  <form onSubmit={handleUpdateFamily} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="family-name">Nama Keluarga</Label>
                      <Input
                        id="family-name"
                        placeholder="cth: Keluarga Smith, Ruko Harmoni"
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                        required
                        disabled={!isFamilyOwnerOrAdmin}
                        className="h-11 border-border"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="family-desc">Deskripsi Keluarga (Opsional)</Label>
                      <Textarea
                        id="family-desc"
                        placeholder="Deskripsi singkat atau moto keluarga Anda"
                        value={familyDesc}
                        onChange={(e) => setFamilyDesc(e.target.value)}
                        disabled={!isFamilyOwnerOrAdmin}
                        className="min-h-16 border-border"
                      />
                    </div>

                    {isFamilyOwnerOrAdmin && (
                      <div className="pt-2 flex justify-end">
                        <Button
                          type="submit"
                          className="gradient-primary text-white font-semibold shadow-soft hover:shadow-soft-lg gap-2 h-10 px-5"
                          disabled={isPending}
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Simpan Setelan Keluarga
                        </Button>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              {/* Members List Section */}
              <div className="card-harmoni p-6">
                <div className="border-b border-border/50 pb-3 mb-4">
                  <h3 className="font-bold text-foreground text-base">Anggota Keluarga</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Daftar semua anggota keluarga yang tergabung dalam workspace ini
                  </p>
                </div>

                <div className="divide-y divide-border/50">
                  {familyDetails.members.map((member) => {
                    const isOwner = member.role === "OWNER";
                    const isMe = member.user.id === currentUserId;
                    // Owner can delete anyone except themselves. Admins can delete members/children.
                    const canRemove =
                      isFamilyOwnerOrAdmin &&
                      !isOwner &&
                      !isMe &&
                      (isFamilyOwner || member.role !== "ADMIN");

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.user.image ?? undefined} />
                            <AvatarFallback className="gradient-primary text-white text-xs font-semibold">
                              {getInitials(member.user.name || member.user.email || "U")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">
                                {member.user.name || "Anggota Keluarga"}
                              </span>
                              {isMe && <Badge className="bg-primary text-white text-[8px] h-4">Saya</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {member.user.email} · Bergabung {formatDate(member.joinedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[9px] py-0.5 px-2 font-bold uppercase tracking-wider",
                              isOwner
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400"
                                : member.role === "ADMIN"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            )}
                          >
                            {member.role}
                          </Badge>

                          {canRemove && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(member.user.id, member.user.name || "")}
                              disabled={removingId === member.user.id}
                              className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-lg"
                            >
                              {removingId === member.user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
