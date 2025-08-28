# 🔧 Cart Functionality Fix Guide

## Problem

The cart is not working - users cannot add items to cart despite being authenticated.

## Root Cause

Row Level Security (RLS) policies are not properly configured for the `cart_items` and `user_preferences` tables, preventing authenticated users from performing cart operations.

## ✅ Solution Steps

### Step 1: Apply RLS Policies

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/dpqapyojcdtrjwuhybky
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `scripts/setup-cart-rls.sql`
4. Click **Run** to execute the SQL

### Step 2: Test Cart Functionality

1. **Sign in** to your application
2. **Navigate** to any gemstone detail page
3. **Click "Add to Cart"** button
4. **Check browser console** for debug logs
5. **Verify cart icon** shows item count
6. **Click cart icon** to open cart drawer

### Step 3: Expected Debug Output

When working correctly, you should see these console logs:

```
🔍 Debug: handleAddToCart called { user: {...}, userId: "...", gemstoneId: "...", inStock: true }
✅ Validation result: { valid: true, errors: [], warnings: [] }
📦 Insert result: { data: {...}, error: null }
✅ Successfully added to cart, updating state
✅ Added to cart! (1)
```

### Step 4: Troubleshooting

If you still see errors:

#### Issue: "User not authenticated"

- **Solution**: Make sure you're properly signed in
- **Check**: Cart icon should be visible in navigation

#### Issue: "Failed to add item to cart"

- **Solution**: RLS policies might not be applied correctly
- **Check**: Re-run the SQL script in Supabase

#### Issue: Empty error object `{}`

- **Solution**: This is usually an RLS permission issue
- **Check**: Verify the user is authenticated and RLS policies are applied

#### Issue: "Failed to get cart summary"

- **Solution**: Check the console logs for detailed debugging information
- **Debug Steps**:
  1. Check if user is authenticated: `🔐 MainNav auth state`
  2. Verify userId is passed: `🛒 useCart.loadCart called with userId`
  3. Check database query: `📊 CartService.getCartSummary called`
  4. Look for RLS errors: `❌ Cart items query error`

#### Issue: "Cannot read properties of undefined (reading 'amount')"

- **Root Cause**: Database query returns flattened fields (price_amount, price_currency) but code expects nested object (price.amount, price.currency)
- **Solution**: Fixed in `enhanceCartItem` method to properly construct price objects from individual database fields
- **Expected Debug Output**:
  ```
  🔍 Gemstone data in enhanceCartItem: {id: "...", price_amount: 5000, price_currency: "USD", ...}
  💰 Unit price calculated: {amount: 5000, currency: "USD"}
  🧮 Line total calculated: {amount: 5000, currency: "USD"}
  ```

## 🧪 Quick Test

Run this command to verify database setup:

```bash
node scripts/test-cart-debug.js
```

This should show:

```
✅ Database connection successful
✅ Found gemstones: 3
✅ Cart items table accessible
✅ User profiles table accessible
✅ Cart insertion successful
```

## 📋 Files Modified

- `scripts/setup-cart-rls.sql` - RLS policy setup script
- `scripts/test-cart-debug.js` - Database connectivity test
- `src/features/gemstones/components/gemstone-detail.tsx` - Added debug logging
- `src/features/cart/hooks/use-cart.ts` - Added debug logging
- `src/features/cart/services/cart-service.ts` - Added debug logging
- `src/shared/components/navigation/main-nav.tsx` - Added auth debugging

## ✅ Expected Success Output

After the fixes are applied, you should see:

```
🔐 MainNav auth state: {user: {id: "...", email: "..."}, userId: "...", hasUser: true}
🛒 useCart.loadCart called with userId: ...
📊 CartService.getCartSummary called for userId: ...
📦 Cart items query result: {cartItemsCount: 1, error: null, hasData: true}
🔍 Gemstone data in enhanceCartItem: {id: "...", price_amount: 5000, ...}
💰 Unit price calculated: {amount: 5000, currency: "USD"}
🧮 Line total calculated: {amount: 5000, currency: "USD"}
✅ Cart summary created: {items: [...], total_items: 1, ...}
📊 Cart summary loaded: {items: [...], total_items: 1, ...}
```

## 🎯 Next Steps

After applying the fixes:

1. **Test cart functionality** thoroughly
2. **Remove debug logs** from production code
3. **Test cart drawer** with selective ordering
4. **Verify checkout flow** works correctly

## 🚨 Important Notes

- **Service Role vs Client**: The debug script uses service role (bypasses RLS) which is why it works
- **RLS Required**: Client-side operations require proper RLS policies for security
- **User Authentication**: Cart only works for authenticated users
- **Foreign Keys**: Ensure gemstone_id and user_id exist in respective tables

## 📞 Support

If issues persist after applying RLS policies:

1. Check browser console for specific error messages
2. Verify user is properly authenticated
3. Confirm RLS policies were applied successfully
4. Check Supabase logs for any database errors

---

**Status**: Ready for RLS policy application and testing
