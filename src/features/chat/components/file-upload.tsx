"use client";

import { Button } from "@/shared/components/ui/button";
import type { FileUploadProps } from "../types/chat.types";
import { Paperclip } from "lucide-react";
import { useRef } from "react";
import { useTranslations } from "next-intl";

export function FileUpload({
  onFilesSelected,
  acceptedTypes = "image/*,.pdf,.doc,.docx",
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  disabled = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("chat");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    // Validate file count
    if (files.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files at once.`);
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert(
        `Some files are too large. Maximum file size is ${Math.round(
          maxSize / 1024 / 1024
        )}MB.`
      );
      return;
    }

    // Validate file types
    const invalidFiles = files.filter((file) => {
      const acceptedTypesArray = acceptedTypes
        .split(",")
        .map((type) => type.trim());

      return !acceptedTypesArray.some((type) => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        } else if (type.includes("*")) {
          const [mainType] = type.split("/");
          return file.type.startsWith(mainType);
        } else {
          return file.type === type;
        }
      });
    });

    if (invalidFiles.length > 0) {
      alert(
        `Some files have unsupported formats. Supported types: ${acceptedTypes}`
      );
      return;
    }

    onFilesSelected(files);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        className="h-10 w-10 p-0 hover:bg-muted/80 dark:hover:bg-muted/60"
        title={t("attachFiles")}
      >
        <Paperclip className="w-4 h-4" />
      </Button>
    </>
  );
}
