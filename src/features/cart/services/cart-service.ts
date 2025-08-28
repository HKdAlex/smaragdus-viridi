import type {
  CartItem,
  CartOperationResult,
  CartSummary,
  CartValidationResult,
  CartValidationRules,
  CurrencyCode,
  Gemstone,
  Money
} from '@/shared/types'

import { supabase } from '@/lib/supabase'
import { Logger } from '@/shared/utils/logger'

export class CartService {
  private supabase = supabase
  private logger = new Logger('CartService')

  // Cart validation rules (from Sprint 5 plan)
  private readonly VALIDATION_RULES: CartValidationRules = {
    max_items: 100,
    max_quantity_per_item: 99,
    cart_expiration_days: 7,
    max_total_value: 1000000, // $10M
    min_item_price: 100, // $1.00
    max_item_price: 10000000, // $100K
  }

  /**
   * Add item to cart with validation
   */
  async addToCart(
    gemstoneId: string,
    quantity: number = 1,
    userId: string
  ): Promise<CartOperationResult> {
    try {
      console.log("🔧 CartService.addToCart called with:", {
        gemstoneId,
        quantity,
        userId
      });

      this.logger.info('Adding item to cart', {
        gemstoneId,
        quantity,
        userId
      })

      // Validate the operation
      console.log("🔍 Validating add to cart operation...");
      const validation = await this.validateAddToCart(gemstoneId, quantity, userId)
      console.log("✅ Validation result:", validation);

      if (!validation.valid) {
        console.log("❌ Validation failed:", validation.errors);
        return {
          success: false,
          error: validation.errors.join(', ')
        }
      }

      // Check if item already exists in cart
      console.log("🔍 Checking for existing cart item...");
      const { data: existingItem, error: existingError } = await this.supabase
        .from('cart_items')
        .select('*')
        .eq('gemstone_id', gemstoneId)
        .eq('user_id', userId)
        .single()

      console.log("📋 Existing item query result:", {
        existingItem,
        existingError,
        hasExistingItem: !!existingItem
      });

      let result: any

      if (existingItem) {
        // Update existing item quantity
        const newQuantity = Math.min(
          (existingItem.quantity || 1) + quantity,
          this.VALIDATION_RULES.max_quantity_per_item
        )

        console.log("🔄 Updating existing cart item:", {
          itemId: existingItem.id,
          oldQuantity: existingItem.quantity,
          newQuantity
        });

        const { data, error } = await this.supabase
          .from('cart_items')
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id)
          .select()
          .single()

        console.log("📦 Update result:", { data, error });

        if (error) {
          console.error("❌ Update failed:", error);
          throw error;
        }
        result = data
      } else {
        // Insert new cart item
        console.log("➕ Inserting new cart item...");

        const { data, error } = await this.supabase
          .from('cart_items')
          .insert({
            gemstone_id: gemstoneId,
            user_id: userId,
            quantity,
            added_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        console.log("📦 Insert result:", { data, error });

        if (error) {
          console.error("❌ Insert failed:", error);
          throw error;
        }
        result = data
      }

      console.log("🔧 Enhancing cart item...");
      const cartItem = await this.enhanceCartItem(result)
      console.log("📊 Getting cart summary...");
      const cartSummary = await this.getCartSummary(userId)

      this.logger.info('Item added to cart successfully', {
        cartItemId: result.id,
        gemstoneId,
        quantity: result.quantity,
        userId
      })

      return {
        success: true,
        item: cartItem,
        cart_summary: cartSummary
      }

    } catch (error) {
      this.logger.error('Failed to add item to cart', error as Error, {
        gemstoneId,
        quantity,
        userId
      })

      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * Update item quantity in cart
   */
  async updateCartItem(
    cartItemId: string,
    quantity: number,
    userId: string
  ): Promise<CartOperationResult> {
    try {
      this.logger.info('Updating cart item quantity', {
        cartItemId,
        quantity,
        userId
      })

      // Validate quantity
      if (quantity < 1 || quantity > this.VALIDATION_RULES.max_quantity_per_item) {
        return {
          success: false,
          error: `Quantity must be between 1 and ${this.VALIDATION_RULES.max_quantity_per_item}`
        }
      }

      // Check if item exists and belongs to user
      const { data: existingItem, error: fetchError } = await this.supabase
        .from('cart_items')
        .select('*')
        .eq('id', cartItemId)
        .eq('user_id', userId)
        .single()

      if (fetchError || !existingItem) {
        return {
          success: false,
          error: 'Cart item not found'
        }
      }

      // Update quantity
      const { data, error } = await this.supabase
        .from('cart_items')
        .update({
          quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartItemId)
        .select()
        .single()

      if (error) throw error

      const cartItem = await this.enhanceCartItem(data)
      const cartSummary = await this.getCartSummary(userId)

      this.logger.info('Cart item updated successfully', {
        cartItemId,
        quantity,
        userId
      })

      return {
        success: true,
        item: cartItem,
        cart_summary: cartSummary
      }

    } catch (error) {
      this.logger.error('Failed to update cart item', error as Error, {
        cartItemId,
        quantity,
        userId
      })

      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(cartItemId: string, userId: string): Promise<CartOperationResult> {
    try {
      this.logger.info('Removing item from cart', {
        cartItemId,
        userId
      })

      // Check if item exists and belongs to user
      const { data: existingItem, error: fetchError } = await this.supabase
        .from('cart_items')
        .select('*')
        .eq('id', cartItemId)
        .eq('user_id', userId)
        .single()

      if (fetchError || !existingItem) {
        return {
          success: false,
          error: 'Cart item not found'
        }
      }

      // Delete the item
      const { error } = await this.supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)

      if (error) throw error

      const cartSummary = await this.getCartSummary(userId)

      this.logger.info('Item removed from cart successfully', {
        cartItemId,
        userId
      })

      return {
        success: true,
        cart_summary: cartSummary
      }

    } catch (error) {
      this.logger.error('Failed to remove item from cart', error as Error, {
        cartItemId,
        userId
      })

      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: string): Promise<CartOperationResult> {
    try {
      this.logger.info('Clearing cart', { userId })

      const { error } = await this.supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      const cartSummary = await this.getCartSummary(userId)

      this.logger.info('Cart cleared successfully', { userId })

      return {
        success: true,
        cart_summary: cartSummary
      }

    } catch (error) {
      this.logger.error('Failed to clear cart', error as Error, { userId })

      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * Get cart summary for user
   */
  async getCartSummary(userId: string): Promise<CartSummary> {
    try {
      const { data: cartItems, error } = await this.supabase
        .from('cart_items')
        .select(`
          *,
          gemstones (
            id,
            name,
            color,
            cut,
            weight_carats,
            price_amount,
            price_currency,
            premium_price_amount,
            premium_price_currency,
            in_stock,
            internal_code,
            serial_number
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) {
        this.logger.error('Cart items query error', error, { userId })
        throw error;
      }

      const enhancedItems: CartItem[] = []
      let totalAmount = 0
      let totalItems = 0

      if (cartItems && cartItems.length > 0) {
        for (const item of cartItems) {
          const enhancedItem = await this.enhanceCartItem(item)
          enhancedItems.push(enhancedItem)
          totalAmount += enhancedItem.line_total.amount
          totalItems += enhancedItem.quantity || 1
        }
      }

      const currency: CurrencyCode = enhancedItems[0]?.unit_price.currency || 'USD'

      return {
        items: enhancedItems,
        total_items: totalItems,
        subtotal: {
          amount: totalAmount,
          currency
        },
        formatted_subtotal: this.formatPrice(totalAmount, currency),
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to get cart summary', error as Error, { userId })
      // Return empty cart on error
      return {
        items: [],
        total_items: 0,
        subtotal: { amount: 0, currency: 'USD' },
        formatted_subtotal: '$0.00',
        last_updated: new Date().toISOString()
      }
    }
  }

  /**
   * Validate adding item to cart
   */
  private async validateAddToCart(
    gemstoneId: string,
    quantity: number,
    userId: string
  ): Promise<CartValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate quantity
    if (quantity < 1 || quantity > this.VALIDATION_RULES.max_quantity_per_item) {
      errors.push(`Quantity must be between 1 and ${this.VALIDATION_RULES.max_quantity_per_item}`)
    }

    // Check if gemstone exists and is available
    const { data: gemstone, error: gemstoneError } = await this.supabase
      .from('gemstones')
      .select('id, in_stock, price_amount')
      .eq('id', gemstoneId)
      .single()

    if (gemstoneError || !gemstone) {
      errors.push('Gemstone not found')
      return { valid: false, errors, warnings }
    }

    if (!gemstone.in_stock) {
      errors.push('Gemstone is not available')
    }

    // Check price limits
    if (gemstone.price_amount < this.VALIDATION_RULES.min_item_price) {
      warnings.push('Item price is below minimum threshold')
    }

    if (gemstone.price_amount > this.VALIDATION_RULES.max_item_price) {
      warnings.push('Item price is above maximum threshold')
    }

    // Check cart item count limit
    const { count: cartItemCount } = await this.supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (cartItemCount && cartItemCount >= this.VALIDATION_RULES.max_items) {
      errors.push(`Cart is full: maximum ${this.VALIDATION_RULES.max_items} items allowed`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Enhance cart item with gemstone data and calculated fields
   */
  private async enhanceCartItem(cartItem: any): Promise<CartItem> {
    const gemstoneData = cartItem.gemstones as any

    // Construct the price object from individual database fields
    const unitPrice: Money = {
      amount: gemstoneData.price_amount || 0,
      currency: gemstoneData.price_currency || 'USD'
    }

    const lineTotal: Money = {
      amount: cartItem.quantity * unitPrice.amount,
      currency: unitPrice.currency
    }

    // Cast the gemstone data to Gemstone type with required properties
    const gemstone: Gemstone = gemstoneData as Gemstone;

    return {
      ...cartItem,
      gemstone,
      unit_price: unitPrice,
      line_total: lineTotal,
      formatted_unit_price: this.formatPrice(unitPrice.amount, unitPrice.currency),
      formatted_line_total: this.formatPrice(lineTotal.amount, lineTotal.currency)
    }
  }

  /**
   * Format price for display
   */
  private formatPrice(amount: number, currency: CurrencyCode): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100)
  }

  /**
   * Get cart validation rules (for UI components)
   */
  getValidationRules(): CartValidationRules {
    return { ...this.VALIDATION_RULES }
  }
}
