"use client";

import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { UserAuditService } from "../../services/user-audit-service";
import type { AuditLogEntry } from "../../types/user-management.types";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ACTION_TYPES = [
  "create",
  "update",
  "delete",
  "role_change",
  "suspend",
  "activate",
  "password_reset",
];

export function UserAuditLogsViewer() {
  const t = useTranslations("admin.users.audit");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const result = await UserAuditService.getAuditLogs({
      page,
      limit,
      action: actionFilter !== "all" ? actionFilter : undefined,
    });

    if (result.success) {
      setLogs(result.data.logs);
      setTotal(result.data.total);
    }
    setLoading(false);
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  const formatAction = (action: string) => {
    const actionKey = `actions.${action}`;
    try {
      return t(actionKey);
    } catch {
      return action.replace("_", " ");
    }
  };

  const formatChanges = (changes: Record<string, unknown>) => {
    if (!changes || Object.keys(changes).length === 0) {
      return "—";
    }
    return JSON.stringify(changes, null, 2);
  };

  if (loading && logs.length === 0) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        <div className="flex items-center gap-2">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {ACTION_TYPES.map((action) => (
                <SelectItem key={action} value={action}>
                  {formatAction(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No audit logs found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("timestamp")}</TableHead>
                    <TableHead>{t("action")}</TableHead>
                    <TableHead>{t("performedBy")}</TableHead>
                    <TableHead>{t("targetUser")}</TableHead>
                    <TableHead>{t("changes")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatAction(log.action)}
                      </TableCell>
                      <TableCell>{log.admin_name || "Unknown"}</TableCell>
                      <TableCell>
                        {log.target_user_name || log.target_user_id || "—"}
                      </TableCell>
                      <TableCell>
                        <details className="cursor-pointer">
                          <summary className="text-sm text-muted-foreground">
                            View details
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-w-md">
                            {formatChanges(log.changes)}
                          </pre>
                        </details>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, total)} of {total} logs
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

