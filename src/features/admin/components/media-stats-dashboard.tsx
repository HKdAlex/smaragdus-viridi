"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  AlertTriangle,
  Database,
  FileVideo,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  HardDrive,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface MediaStats {
  totalImages: number;
  totalVideos: number;
  totalStorageFiles: number;
  orphanedImages: Array<{
    id: string;
    gemstone_id: string;
    original_path: string | null;
    image_url: string;
    original_filename: string | null;
  }>;
  orphanedVideos: Array<{
    id: string;
    gemstone_id: string;
    original_path: string | null;
    video_url: string;
    original_filename: string | null;
  }>;
  orphanedStorageFiles: Array<{
    name: string;
    path: string;
    size: number;
    lastModified: string;
  }>;
  storageSize: {
    total: number;
    images: number;
    videos: number;
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function MediaStatsDashboard() {
  const t = useTranslations("admin");
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/media/stats");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch media statistics");
      }

      const result = await response.json();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("[MediaStatsDashboard] Error fetching stats:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading media statistics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="mt-4"
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const totalOrphans =
    stats.orphanedImages.length +
    stats.orphanedVideos.length +
    stats.orphanedStorageFiles.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Media Statistics</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of media files and orphaned records
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalImages}</div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(stats.storageSize.images)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <FileVideo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVideos}</div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(stats.storageSize.videos)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Files</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStorageFiles}</div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(stats.storageSize.total)}
            </p>
          </CardContent>
        </Card>

        <Card className={totalOrphans > 0 ? "border-yellow-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orphaned Items</CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${
                totalOrphans > 0 ? "text-yellow-600" : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrphans}</div>
            <p className="text-xs text-muted-foreground">
              {stats.orphanedImages.length} images, {stats.orphanedVideos.length} videos,{" "}
              {stats.orphanedStorageFiles.length} files
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orphaned Items */}
      {totalOrphans > 0 && (
        <div className="space-y-4">
          {/* Orphaned Images */}
          {stats.orphanedImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-yellow-600" />
                  Orphaned Image Records ({stats.orphanedImages.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Database records without corresponding storage files
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {stats.orphanedImages.map((img) => (
                    <div
                      key={img.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{img.original_filename || img.id}</p>
                        <p className="text-sm text-muted-foreground">
                          Gemstone: {img.gemstone_id.slice(0, 8)}...
                        </p>
                        {img.original_path && (
                          <p className="text-xs text-muted-foreground">
                            Path: {img.original_path}
                          </p>
                        )}
                      </div>
                      <Badge variant="destructive">Missing File</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orphaned Videos */}
          {stats.orphanedVideos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-yellow-600" />
                  Orphaned Video Records ({stats.orphanedVideos.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Database records without corresponding storage files
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {stats.orphanedVideos.map((vid) => (
                    <div
                      key={vid.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{vid.original_filename || vid.id}</p>
                        <p className="text-sm text-muted-foreground">
                          Gemstone: {vid.gemstone_id.slice(0, 8)}...
                        </p>
                        {vid.original_path && (
                          <p className="text-xs text-muted-foreground">
                            Path: {vid.original_path}
                          </p>
                        )}
                      </div>
                      <Badge variant="destructive">Missing File</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orphaned Storage Files */}
          {stats.orphanedStorageFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-yellow-600" />
                  Orphaned Storage Files ({stats.orphanedStorageFiles.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Storage files without corresponding database records
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {stats.orphanedStorageFiles.map((file, idx) => (
                    <div
                      key={`${file.path}-${idx}`}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.path}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(file.size)} •{" "}
                          {new Date(file.lastModified).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="destructive">No DB Record</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No Orphans Message */}
      {totalOrphans === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Database className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No Orphaned Items</h3>
            <p className="text-muted-foreground">
              All media files are properly linked between database and storage.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

