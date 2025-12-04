/**
 * Use Admin Gemstone Mutations Hook
 *
 * React Query mutations for gemstone CRUD operations.
 * Provides optimistic updates, automatic cache invalidation, and error handling.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { GemstoneAdminApiService } from "../services/gemstone-admin-api-service";
import { GemstoneAdminService, type GemstoneFormData, type GemstoneWithRelations } from "../services/gemstone-admin-service";
import type { DatabaseGemstone } from "@/shared/types";

/**
 * Hook for creating a new gemstone
 *
 * On success:
 * - Invalidates gemstone list cache
 * - Returns the created gemstone
 */
export function useCreateGemstone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: GemstoneFormData) => {
      const result = await GemstoneAdminService.createGemstone(formData);
      if (!result.success) {
        throw new Error(result.error || "Failed to create gemstone");
      }
      return result.data as DatabaseGemstone;
    },
    onSuccess: () => {
      // Invalidate list cache to show new gemstone
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.gemstones.lists() });
    },
  });
}

export interface UpdateGemstoneParams {
  id: string;
  data: Partial<GemstoneFormData>;
}

/**
 * Hook for updating an existing gemstone
 *
 * On success:
 * - Invalidates gemstone list cache
 * - Invalidates specific gemstone detail cache
 * - Returns the updated gemstone
 */
export function useUpdateGemstone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateGemstoneParams) => {
      const result = await GemstoneAdminApiService.updateGemstone(id, data);
      if (!result.success) {
        throw new Error(result.error || "Failed to update gemstone");
      }
      return result.data as DatabaseGemstone;
    },
    onSuccess: (_, { id }) => {
      // Invalidate list cache
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.gemstones.lists() });
      // Invalidate specific gemstone cache
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.gemstones.detail(id) });
    },
  });
}

/**
 * Hook for deleting a gemstone
 *
 * On success:
 * - Invalidates gemstone list cache
 * - Removes specific gemstone from cache
 */
export function useDeleteGemstone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await GemstoneAdminApiService.deleteGemstone(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete gemstone");
      }
      return id;
    },
    onSuccess: (id) => {
      // Invalidate list cache
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.gemstones.lists() });
      // Remove specific gemstone from cache
      queryClient.removeQueries({ queryKey: queryKeys.admin.gemstones.detail(id) });
    },
  });
}

export interface SetPrimaryMediaParams {
  gemstoneId: string;
  mediaId: string;
  mediaType: "image" | "video";
}

/**
 * Hook for setting primary image/video
 *
 * On success:
 * - Invalidates specific gemstone detail cache
 */
export function useSetPrimaryMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gemstoneId, mediaId, mediaType }: SetPrimaryMediaParams) => {
      const result = mediaType === "image"
        ? await GemstoneAdminApiService.setPrimaryImage(gemstoneId, mediaId)
        : await GemstoneAdminApiService.setPrimaryVideo(gemstoneId, mediaId);
      
      if (!result.success) {
        throw new Error(result.error || `Failed to set primary ${mediaType}`);
      }
      return { gemstoneId, mediaId, mediaType };
    },
    onSuccess: ({ gemstoneId }) => {
      // Invalidate specific gemstone cache
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.gemstones.detail(gemstoneId) });
      // Also invalidate list to update thumbnails
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.gemstones.lists() });
    },
  });
}

export interface DeleteMediaParams {
  gemstoneId: string;
  mediaId: string;
  mediaType: "image" | "video";
}

/**
 * Hook for deleting media
 *
 * On success:
 * - Invalidates specific gemstone detail cache
 */
export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gemstoneId, mediaId, mediaType }: DeleteMediaParams) => {
      const result = await GemstoneAdminApiService.deleteMedia(gemstoneId, mediaId, mediaType);
      if (!result.success) {
        throw new Error(result.error || `Failed to delete ${mediaType}`);
      }
      return { gemstoneId, mediaId, mediaType };
    },
    onSuccess: ({ gemstoneId }) => {
      // Invalidate specific gemstone cache
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.gemstones.detail(gemstoneId) });
      // Also invalidate list to update media counts
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.gemstones.lists() });
    },
  });
}

/**
 * Hook to manually invalidate all admin gemstone caches
 * Useful after bulk operations or external changes
 */
export function useInvalidateAdminGemstones() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.gemstones.all() });
  };
}

