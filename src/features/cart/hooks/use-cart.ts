"use client"

import type {
    CartItem,
    CartOperationResult,
    CartSummary,
    CartValidationRules,
    CurrencyCode,
    Money
} from '@/shared/types'
import { useCallback, useEffect, useState } from 'react'

import { CartService } from '../services/cart-service'

export function useCart(userId?: string) {
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cartService = new CartService()

  // Load cart on mount and when userId changes
  useEffect(() => {
    if (userId) {
      loadCart()
    } else {
      setCartSummary(null)
    }
  }, [userId])

  const loadCart = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const summary = await cartService.getCartSummary(userId)
      setCartSummary(summary)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cart'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [userId, cartService])

  const addToCart = useCallback(async (
    gemstoneId: string,
    quantity: number = 1
  ): Promise<boolean> => {
    console.log("🛒 useCart.addToCart called with:", {
      gemstoneId,
      quantity,
      userId,
      hasUserId: !!userId
    });

    if (!userId) {
      const errorMsg = 'User not authenticated'
      console.error("❌ useCart.addToCart:", errorMsg);
      setError(errorMsg)
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("🔧 Calling cartService.addToCart...");
      const result: CartOperationResult = await cartService.addToCart(
        gemstoneId,
        quantity,
        userId
      )

      console.log("📦 Cart service result:", result);

      if (result.success && result.cart_summary) {
        console.log("✅ Successfully added to cart, updating state");
        setCartSummary(result.cart_summary)
        return true
      } else {
        const errorMsg = result.error || 'Failed to add item to cart'
        console.error("❌ Cart service failed:", errorMsg);
        setError(errorMsg)
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to cart'
      console.error("💥 Cart service threw exception:", err);
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [userId, cartService])

  const updateQuantity = useCallback(async (
    cartItemId: string,
    quantity: number
  ): Promise<boolean> => {
    if (!userId) {
      setError('User not authenticated')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const result: CartOperationResult = await cartService.updateCartItem(
        cartItemId,
        quantity,
        userId
      )

      if (result.success && result.cart_summary) {
        setCartSummary(result.cart_summary)
        return true
      } else {
        setError(result.error || 'Failed to update item quantity')
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item quantity'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [userId, cartService])

  const removeFromCart = useCallback(async (cartItemId: string): Promise<boolean> => {
    if (!userId) {
      setError('User not authenticated')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const result: CartOperationResult = await cartService.removeFromCart(
        cartItemId,
        userId
      )

      if (result.success && result.cart_summary) {
        setCartSummary(result.cart_summary)
        return true
      } else {
        setError(result.error || 'Failed to remove item from cart')
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item from cart'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [userId, cartService])

  const clearCart = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      setError('User not authenticated')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const result: CartOperationResult = await cartService.clearCart(userId)

      if (result.success && result.cart_summary) {
        setCartSummary(result.cart_summary)
        return true
      } else {
        setError(result.error || 'Failed to clear cart')
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cart'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [userId, cartService])

  const getItemCount = useCallback((): number => {
    return cartSummary?.total_items || 0
  }, [cartSummary])

  const getTotalPrice = useCallback((): string => {
    return cartSummary?.formatted_subtotal || '$0.00'
  }, [cartSummary])

  const getValidationRules = useCallback((): CartValidationRules => {
    return cartService.getValidationRules()
  }, [cartService])

  const isInCart = useCallback((gemstoneId: string): boolean => {
    return cartSummary?.items.some(item => item.gemstone_id === gemstoneId) || false
  }, [cartSummary])

  const getCartItemQuantity = useCallback((gemstoneId: string): number => {
    const item = cartSummary?.items.find(item => item.gemstone_id === gemstoneId)
    return item?.quantity || 0
  }, [cartSummary])

  // Selection management
  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }, [])

  const selectAllItems = useCallback(() => {
    if (cartSummary) {
      setSelectedItems(new Set(cartSummary.items.map(item => item.id)))
    }
  }, [cartSummary])

  const deselectAllItems = useCallback(() => {
    setSelectedItems(new Set())
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (cartSummary) {
      const allSelected = cartSummary.items.every(item => selectedItems.has(item.id))
      if (allSelected) {
        deselectAllItems()
      } else {
        selectAllItems()
      }
    }
  }, [cartSummary, selectedItems, selectAllItems, deselectAllItems])

  const isItemSelected = useCallback((itemId: string): boolean => {
    return selectedItems.has(itemId)
  }, [selectedItems])

  const isAllSelected = useCallback((): boolean => {
    if (!cartSummary) return false
    return cartSummary.items.length > 0 &&
           cartSummary.items.every(item => selectedItems.has(item.id))
  }, [cartSummary, selectedItems])

  const getSelectedItems = useCallback((): CartItem[] => {
    if (!cartSummary) return []
    return cartSummary.items.filter(item => selectedItems.has(item.id))
  }, [cartSummary, selectedItems])

  const getSelectedItemsCount = useCallback((): number => {
    return selectedItems.size
  }, [selectedItems])

  const getSelectedTotal = useCallback((): Money => {
    const selectedItemsList = getSelectedItems()
    const totalAmount = selectedItemsList.reduce((sum, item) => sum + item.line_total.amount, 0)
    const currency = selectedItemsList[0]?.line_total.currency || 'USD'

    return {
      amount: totalAmount,
      currency: currency as CurrencyCode
    }
  }, [getSelectedItems])

  // Reset selections when cart changes
  useEffect(() => {
    if (cartSummary) {
      // Keep only items that still exist in the cart
      setSelectedItems(prev => {
        const validIds = new Set(cartSummary.items.map(item => item.id))
        const filtered = new Set([...prev].filter(id => validIds.has(id)))
        return filtered
      })
    } else {
      setSelectedItems(new Set())
    }
  }, [cartSummary])

  return {
    // State
    cartSummary,
    isLoading,
    error,

    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    loadCart,

    // Getters
    getItemCount,
    getTotalPrice,
    getValidationRules,
    isInCart,
    getCartItemQuantity,

    // Selection management
    toggleItemSelection,
    toggleSelectAll,
    isItemSelected,
    isAllSelected,
    getSelectedItems,
    getSelectedItemsCount,
    getSelectedTotal,

    // Utilities
    clearError: () => setError(null)
  }
}
