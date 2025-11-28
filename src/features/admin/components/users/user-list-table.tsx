"use client";

import { Button } from "@/shared/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, FileText, Key } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback, useEffect } from "react";
import { UserManagementService } from "../../services/user-management-service";
import type { UserWithAuth, UserFilters } from "../../types/user-management.types";
import { UserBulkActions } from "./user-bulk-actions";
import { UserFormDialog } from "./user-form-dialog";
import { UserFiltersSidebar } from "./user-filters-sidebar";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Filter } from "lucide-react";

interface UserListTableProps {
  onRefresh?: () => void;
}

export function UserListTable({ onRefresh }: UserListTableProps) {
  const t = useTranslations("admin.users");
  const [users, setUsers] = useState<UserWithAuth[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<UserFilters>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithAuth | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const result = await UserManagementService.getUsers({
      page,
      limit: 20,
      filters,
      sort_by: "created_at",
      sort_order: "desc",
    });

    if (result.success) {
      setUsers(result.data.users);
      setTotalPages(result.data.total_pages);
    }
    setLoading(false);
  }, [page, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const handleEdit = (user: UserWithAuth) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleDelete = async (user: UserWithAuth) => {
    if (!confirm(t("confirmations.deleteMessage", { name: user.name }))) {
      return;
    }
    const result = await UserManagementService.deleteUser(user.user_id);
    if (result.success) {
      fetchUsers();
      onRefresh?.();
    } else {
      alert(result.error);
    }
  };

  const handleBulkAction = async (
    operation: "role_change" | "activate" | "suspend" | "delete"
  ) => {
    if (selectedUsers.size === 0) return;
    // Implementation for bulk actions
    const result = await UserManagementService.bulkOperation({
      user_ids: Array.from(selectedUsers),
      operation,
    });
    if (result.success) {
      setSelectedUsers(new Set());
      fetchUsers();
      onRefresh?.();
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (editingUser) {
      await UserManagementService.updateUser(editingUser.user_id, data);
    } else {
      await UserManagementService.createUser(data);
    }
    fetchUsers();
    onRefresh?.();
  };

  if (loading) {
    return <div className="p-4">Loading users...</div>;
  }

  return (
    <div className="flex gap-4">
      <UserFiltersSidebar
        filters={filters}
        onFiltersChange={setFilters}
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
      />
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <h3 className="text-lg font-semibold">{t("tabs.allUsers")}</h3>
          </div>
          <Button onClick={handleCreate}>{t("addUser")}</Button>
        </div>

      <UserBulkActions
        selectedCount={selectedUsers.size}
        onBulkAction={handleBulkAction}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUsers(new Set(users.map((u) => u.user_id)));
                      } else {
                        setSelectedUsers(new Set());
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.has(user.user_id)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedUsers);
                        if (checked) {
                          newSelected.add(user.user_id);
                        } else {
                          newSelected.delete(user.user_id);
                        }
                        setSelectedUsers(newSelected);
                      }}
                    />
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.auth_email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at || "").toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t("actions.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(user)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("actions.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>

        <UserFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          user={editingUser}
          onSubmit={handleFormSubmit}
        />
      </div>
    </div>
  );
}

