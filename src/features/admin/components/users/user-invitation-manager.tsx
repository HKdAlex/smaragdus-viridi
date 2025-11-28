"use client";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { UserInvitationService } from "../../services/user-invitation-service";
import type { UserInvitation } from "../../types/user-management.types";
import { UserRole } from "@/shared/types";
import { UserPlus, Mail } from "lucide-react";

const USER_ROLES: UserRole[] = ["regular_customer", "premium_customer", "admin"];

export function UserInvitationManager() {
  const t = useTranslations("admin.users.invitations");
  const tCommon = useTranslations("admin.users");
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role: "regular_customer" as UserRole,
  });

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    setLoading(true);
    const result = await UserInvitationService.getInvitations({ status: "pending" });
    if (result.success) {
      setInvitations(result.data);
    } else {
      console.error("Failed to load invitations:", result.error);
    }
    setLoading(false);
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const result = await UserInvitationService.sendInvitation({
        email: formData.email,
        role: formData.role,
      });

      if (result.success) {
        alert(t("createSuccess", { email: formData.email }));
        setIsCreateDialogOpen(false);
        setFormData({ email: "", role: "regular_customer" });
        fetchInvitations();
      } else {
        alert(result.error || "Failed to create invitation");
      }
    } catch (error) {
      alert("Failed to create invitation");
      console.error("Failed to create invitation:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleResend = async (id: string) => {
    const result = await UserInvitationService.resendInvitation(id);
    if (result.success) {
      alert(t("resendSuccess"));
      fetchInvitations();
    } else {
      alert(result.error || "Failed to resend invitation");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) {
      return;
    }
    const result = await UserInvitationService.cancelInvitation(id);
    if (result.success) {
      alert(t("cancelSuccess"));
      fetchInvitations();
    } else {
      alert(result.error || "Failed to cancel invitation");
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("pending")}</h3>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          {t("createInvitation")}
        </Button>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateInvitation}>
            <DialogHeader>
              <DialogTitle>{t("createInvitation")}</DialogTitle>
              <DialogDescription>
                {t("createInvitationDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="invite-email">{tCommon("form.email")}</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="invite-role">{tCommon("form.role")}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value as UserRole })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Sending..." : t("sendInvitation")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {invitations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold mb-2">{t("noInvitations")}</h4>
            <p className="text-sm text-muted-foreground mb-4">
              {t("noInvitationsDescription")}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              {t("createInvitation")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {invitations.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{inv.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("sentBy", { name: inv.invited_by_name })} • {t("expiresOn", {
                        date: new Date(inv.expires_at).toLocaleDateString(),
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Role: {inv.role?.replace("_", " ") || "regular_customer"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResend(inv.id)}
                    >
                      {t("resend")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(inv.id)}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

