"use client";

import {
  Archive,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  MoreHorizontal,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

import { Button } from "@/shared/components/ui/button";
import type { DatabaseGemstone } from "@/shared/types";
import { useState } from "react";

interface GemstoneActionsMenuProps {
  gemstone: DatabaseGemstone;
  onView?: (gemstone: DatabaseGemstone) => void;
  onEdit?: (gemstone: DatabaseGemstone) => void;
  onDelete?: (gemstone: DatabaseGemstone) => void;
  onDuplicate?: (gemstone: DatabaseGemstone) => void;
  onExportSingle?: (gemstone: DatabaseGemstone) => void;
  onArchive?: (gemstone: DatabaseGemstone) => void;
  onRestore?: (gemstone: DatabaseGemstone) => void;
  isArchived?: boolean;
}

export function GemstoneActionsMenu({
  gemstone,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onExportSingle,
  onArchive,
  onRestore,
  isArchived = false,
}: GemstoneActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleView = () => {
    onView?.(gemstone);
    setIsOpen(false);
  };

  const handleEdit = () => {
    onEdit?.(gemstone);
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${gemstone.serial_number}"? This action cannot be undone.`
      )
    ) {
      onDelete?.(gemstone);
    }
    setIsOpen(false);
  };

  const handleDuplicate = () => {
    onDuplicate?.(gemstone);
    setIsOpen(false);
  };

  const handleExportSingle = () => {
    onExportSingle?.(gemstone);
    setIsOpen(false);
  };

  const handleArchive = () => {
    onArchive?.(gemstone);
    setIsOpen(false);
  };

  const handleRestore = () => {
    onRestore?.(gemstone);
    setIsOpen(false);
  };

  const handleCopySerialNumber = async () => {
    try {
      await navigator.clipboard.writeText(gemstone.serial_number);
      // You could show a toast notification here
      console.log("Serial number copied to clipboard");
    } catch (error) {
      console.error("Failed to copy serial number:", error);
    }
    setIsOpen(false);
  };

  const handleOpenInNewTab = () => {
    // This would open the gemstone detail page in a new tab
    const url = `/catalog/${gemstone.id}`;
    window.open(url, "_blank");
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        {/* Primary Actions */}
        <DropdownMenuItem onClick={handleView}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Gemstone
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Utility Actions */}
        <DropdownMenuItem onClick={handleCopySerialNumber}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Serial Number
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleOpenInNewTab}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in New Tab
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Data Actions */}
        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate Gemstone
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleExportSingle}>
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Archive/Restore Actions */}
        {isArchived ? (
          <DropdownMenuItem onClick={handleRestore} className="text-green-600">
            <RotateCcw className="mr-2 h-4 w-4" />
            Restore Gemstone
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleArchive} className="text-orange-600">
            <Archive className="mr-2 h-4 w-4" />
            Archive Gemstone
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Destructive Actions */}
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Gemstone
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
