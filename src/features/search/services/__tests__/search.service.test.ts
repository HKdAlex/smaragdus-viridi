/**
 * Unit Tests: SearchService
 * 
 * Tests for full-text search business logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchService } from '../search.service';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
  },
}));

describe('SearchService', () => {
  describe('sanitizeSearchQuery', () => {
    it('should remove angle brackets', () => {
      const result = SearchService.sanitizeSearchQuery('ruby<script>');
      expect(result).toBe('rubyscript');
    });

    it('should remove boolean operators', () => {
      const result = SearchService.sanitizeSearchQuery('ruby&sapphire|emerald');
      expect(result).toBe('rubysapphireemerald');
    });

    it('should trim whitespace', () => {
      const result = SearchService.sanitizeSearchQuery('  ruby  ');
      expect(result).toBe('ruby');
    });

    it('should handle empty string', () => {
      const result = SearchService.sanitizeSearchQuery('');
      expect(result).toBe('');
    });

    it('should handle special characters', () => {
      const result = SearchService.sanitizeSearchQuery('ruby!()|&');
      expect(result).toBe('ruby');
    });
  });

  describe('buildWeightedSearchQuery', () => {
    it('should build weighted query for single term', () => {
      const result = SearchService.buildWeightedSearchQuery('ruby');
      expect(result).toBe('ruby:A');
    });

    it('should build weighted query for multiple terms', () => {
      const result = SearchService.buildWeightedSearchQuery('ruby 2ct');
      expect(result).toBe('ruby:A & 2ct:B');
    });

    it('should handle extra whitespace', () => {
      const result = SearchService.buildWeightedSearchQuery('ruby   2ct');
      expect(result).toBe('ruby:A & 2ct:B');
    });

    it('should handle empty string', () => {
      const result = SearchService.buildWeightedSearchQuery('');
      expect(result).toBe('');
    });

    it('should sanitize before building', () => {
      const result = SearchService.buildWeightedSearchQuery('ruby<script> 2ct');
      expect(result).toBe('rubyscript:A & 2ct:B');
    });

    it('should weight first term highest', () => {
      const result = SearchService.buildWeightedSearchQuery('important secondary');
      expect(result).toBe('important:A & secondary:B');
    });
  });

  describe('searchGemstones', () => {
    it('should call RPC with correct parameters', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            serial_number: 'RUB-001',
            name: 'Ruby',
            gemstone_type: 'Ruby',
            color: 'Red',
            cut: 'Round',
            clarity: 'VS1',
            origin: 'Burma',
            weight_carats: 2.5,
            price_amount: 5000,
            price_currency: 'USD',
            description: 'Beautiful ruby',
            has_certification: true,
            has_ai_analysis: false,
            metadata_status: 'complete',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
            relevance_score: 0.8,
            total_count: 1,
          },
        ],
        error: null,
      });

      const { supabaseAdmin } = await import('@/lib/supabase');
      vi.mocked(supabaseAdmin.rpc).mockImplementation(mockRpc as any);

      const result = await SearchService.searchGemstones({
        query: 'ruby',
        page: 1,
        pageSize: 24,
        filters: {},
      });

      expect(mockRpc).toHaveBeenCalledWith('search_gemstones_fulltext', {
        search_query: 'ruby',
        filters: {},
        page_num: 1,
        page_size: 24,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].serial_number).toBe('RUB-001');
      expect(result.pagination.totalItems).toBe(1);
    });

    it('should handle empty results', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const { supabaseAdmin } = await import('@/lib/supabase');
      vi.mocked(supabaseAdmin.rpc).mockImplementation(mockRpc as any);

      const result = await SearchService.searchGemstones({
        query: 'nonexistent',
        page: 1,
        pageSize: 24,
        filters: {},
      });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.totalItems).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should handle database errors', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const { supabaseAdmin } = await import('@/lib/supabase');
      vi.mocked(supabaseAdmin.rpc).mockImplementation(mockRpc as any);

      await expect(
        SearchService.searchGemstones({
          query: 'ruby',
          page: 1,
          pageSize: 24,
          filters: {},
        })
      ).rejects.toThrow('Search failed: Database error');
    });

    it('should calculate pagination correctly', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: Array(24).fill({
          id: '123e4567-e89b-12d3-a456-426614174000',
          serial_number: 'RUB-001',
          total_count: 100,
        }),
        error: null,
      });

      const { supabaseAdmin } = await import('@/lib/supabase');
      vi.mocked(supabaseAdmin.rpc).mockImplementation(mockRpc as any);

      const result = await SearchService.searchGemstones({
        query: 'ruby',
        page: 2,
        pageSize: 24,
        filters: {},
      });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(Math.ceil(100 / 24));
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(true);
    });

    it('should handle empty query (browse mode)', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: [{ total_count: 50 }],
        error: null,
      });

      const { supabaseAdmin } = await import('@/lib/supabase');
      vi.mocked(supabaseAdmin.rpc).mockImplementation(mockRpc as any);

      await SearchService.searchGemstones({
        page: 1,
        pageSize: 24,
        filters: {},
      });

      expect(mockRpc).toHaveBeenCalledWith('search_gemstones_fulltext', {
        search_query: '',
        filters: {},
        page_num: 1,
        page_size: 24,
      });
    });
  });

  describe('getSuggestions', () => {
    it('should call RPC with correct parameters', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: [
          { suggestion: 'Ruby', category: 'type', relevance: 0.9 },
          { suggestion: 'RUB-001', category: 'serial_number', relevance: 0.8 },
        ],
        error: null,
      });

      const { supabaseAdmin } = await import('@/lib/supabase');
      vi.mocked(supabaseAdmin.rpc).mockImplementation(mockRpc as any);

      const result = await SearchService.getSuggestions('rub', 10);

      expect(mockRpc).toHaveBeenCalledWith('get_search_suggestions', {
        query: 'rub',
        limit_count: 10,
      });

      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0].suggestion).toBe('Ruby');
      expect(result.suggestions[0].category).toBe('type');
    });

    it('should handle empty suggestions', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const { supabaseAdmin } = await import('@/lib/supabase');
      vi.mocked(supabaseAdmin.rpc).mockImplementation(mockRpc as any);

      const result = await SearchService.getSuggestions('xyz', 10);

      expect(result.suggestions).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const { supabaseAdmin } = await import('@/lib/supabase');
      vi.mocked(supabaseAdmin.rpc).mockImplementation(mockRpc as any);

      await expect(
        SearchService.getSuggestions('ruby', 10)
      ).rejects.toThrow('Suggestions failed: Database error');
    });

    it('should use default limit', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const { supabaseAdmin } = await import('@/lib/supabase');
      vi.mocked(supabaseAdmin.rpc).mockImplementation(mockRpc as any);

      await SearchService.getSuggestions('ruby');

      expect(mockRpc).toHaveBeenCalledWith('get_search_suggestions', {
        query: 'ruby',
        limit_count: 10,
      });
    });
  });
});

