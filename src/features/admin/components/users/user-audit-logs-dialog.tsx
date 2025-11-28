"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { UserAuditService } from "../../services/user-audit-service";
import type { AuditLogEntry } from "../../types/user-management.types";

interface UserAuditLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function UserAuditLogsDialog({
  open,
  onOpenChange,
  userId,
}: UserAuditLogsDialogProps) {
  const t = useTranslations("admin.users.audit");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      UserAuditService.getUserAuditLogs(userId).then((result) => {
        if (result.success) {
          setLogs(result.data);
        }
        setLoading(false);
      });
    }
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>Audit log for user actions</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="p-4">Loading...</div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="border-b p-2">
                <div className="flex justify-between">
                  <span className="font-medium">{t(`actions.${log.action}`)}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("performedBy")}: {log.admin_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

