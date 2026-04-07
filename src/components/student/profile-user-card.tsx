"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProfileUserCardProps {
  userName: string;
  userEmail: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function ProfileUserCard({ userName, userEmail }: ProfileUserCardProps) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        {/* Avatar with initials */}
        <div className="w-14 h-14 rounded-full bg-aulas flex items-center justify-center text-white font-bold text-lg shrink-0">
          {getInitials(userName)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary truncate">{userName}</p>
          <p className="text-sm text-text-secondary truncate">{userEmail}</p>
        </div>

        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut size={18} />
          Sair
        </Button>
      </CardContent>
    </Card>
  );
}
