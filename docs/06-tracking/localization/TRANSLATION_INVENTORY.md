# 🔍 Translation Inventory - Smaragdus Viridi

**Comprehensive Catalog of Translatable Strings** | **Version 1.0** | **January 2025**

## 📊 **INVENTORY OVERVIEW**

| Category           | Files  | Estimated Strings | Priority    | Status           |
| ------------------ | ------ | ----------------- | ----------- | ---------------- |
| Navigation         | 3      | 15-20             | 🔴 Critical | 📝 Cataloged     |
| Authentication     | 5      | 25-30             | 🔴 Critical | 📝 Cataloged     |
| Product Catalog    | 8      | 60-80             | 🔴 Critical | 📝 Cataloged     |
| Shopping Cart      | 6      | 35-45             | 🔴 Critical | 📝 Cataloged     |
| Admin Panel        | 12     | 80-100            | 🟡 High     | 📝 Cataloged     |
| Footer & Legal     | 1      | 20-25             | 🟢 Medium   | 📝 Cataloged     |
| Forms & Validation | 8      | 40-50             | 🟡 High     | 📝 Cataloged     |
| Error Messages     | 10     | 30-40             | 🟡 High     | 📝 Cataloged     |
| **TOTAL**          | **53** | **305-440**       |             | 📝 **Cataloged** |

---

## 🧭 **1. NAVIGATION STRINGS** 🔴 **CRITICAL**

### **Main Navigation** (`src/shared/components/navigation/main-nav.tsx`)

```json
{
  "navigation": {
    "home": "Home",
    "catalog": "Catalog",
    "about": "About",
    "contact": "Contact",
    "admin": "Admin"
  },
  "auth": {
    "signIn": "Sign In",
    "signUp": "Sign Up",
    "signOut": "Sign Out",
    "welcome": "Welcome, {email}",
    "shoppingCart": "Shopping Cart",
    "continueShopping": "Continue Shopping",
    "search": "Search"
  },
  "mobile": {
    "toggleMenu": "Toggle menu",
    "close": "Close"
  }
}
```

### **Breadcrumbs** (Various pages)

```json
{
  "breadcrumbs": {
    "home": "Home",
    "catalog": "Catalog",
    "product": "Product",
    "cart": "Shopping Cart",
    "checkout": "Checkout",
    "admin": "Admin Panel"
  }
}
```

---

## 🔐 **2. AUTHENTICATION STRINGS** 🔴 **CRITICAL**

### **Login Page** (`src/app/(auth)/login/page.tsx`)

```json
{
  "auth": {
    "login": {
      "title": "Sign in to your account",
      "subtitle": "Access your gemstone collection",
      "dontHaveAccount": "Don't have an account? Sign up"
    }
  }
}
```

### **Login Form** (`src/features/auth/components/login-form.tsx`)

```json
{
  "auth": {
    "form": {
      "email": "Email",
      "password": "Password",
      "emailPlaceholder": "Enter your email",
      "passwordPlaceholder": "Enter your password",
      "signingIn": "Signing in...",
      "signIn": "Sign In",
      "signInFailed": "Sign in failed"
    }
  }
}
```

### **Signup Form** (`src/features/auth/components/signup-form.tsx`)

```json
{
  "auth": {
    "signup": {
      "title": "Create your account",
      "subtitle": "Join our gemstone community",
      "alreadyHaveAccount": "Already have an account? Sign in",
      "form": {
        "name": "Full Name",
        "email": "Email",
        "password": "Password",
        "confirmPassword": "Confirm Password",
        "creatingAccount": "Creating account...",
        "signUp": "Sign Up"
      }
    }
  }
}
```

---

## 💎 **3. PRODUCT CATALOG STRINGS** 🔴 **CRITICAL**

### **Catalog Page** (`src/features/gemstones/components/gemstone-catalog.tsx`)

```json
{
  "catalog": {
    "title": "Gemstone Catalog",
    "subtitle": "Discover our premium collection",
    "loading": "Loading gemstones...",
    "noResults": "No gemstones found",
    "search": "Search gemstones...",
    "filters": "Filters",
    "sort": "Sort by",
    "viewDetails": "View Details",
    "addToCart": "Add to Cart",
    "outOfStock": "Out of Stock",
    "inStock": "In Stock",
    "price": "Price",
    "carat": "Carat",
    "cut": "Cut",
    "color": "Color",
    "clarity": "Clarity"
  }
}
```

### **Product Detail Page** (`src/app/catalog/[id]/page.tsx`)

```json
{
  "product": {
    "loading": "Loading gemstone details...",
    "notFound": "Gemstone not found",
    "specifications": "Specifications",
    "description": "Description",
    "certifications": "Certifications",
    "origin": "Origin",
    "weight": "Weight",
    "dimensions": "Dimensions",
    "treatment": "Treatment",
    "pricePerCarat": "Price per Carat",
    "totalPrice": "Total Price",
    "addToCart": "Add to Cart",
    "share": "Share",
    "print": "Print",
    "download": "Download",
    "relatedProducts": "Related Products"
  }
}
```

### **Advanced Filters** (`src/features/gemstones/components/filters/advanced-filters.tsx`)

```json
{
  "filters": {
    "title": "Advanced Filters",
    "gemstoneType": "Gemstone Type",
    "color": "Color",
    "cut": "Cut",
    "clarity": "Clarity",
    "priceRange": "Price Range",
    "weightRange": "Weight Range (carats)",
    "origin": "Origin",
    "certification": "Certification",
    "availability": "Availability",
    "minPrice": "Min Price",
    "maxPrice": "Max Price",
    "minWeight": "Min Weight",
    "maxWeight": "Max Weight",
    "inStock": "In Stock",
    "outOfStock": "Out of Stock",
    "resetFilters": "Reset Filters",
    "applyFilters": "Apply Filters",
    "clearAll": "Clear All"
  }
}
```

---

## 🛒 **4. SHOPPING CART STRINGS** 🔴 **CRITICAL**

### **Cart Page** (`src/features/cart/components/cart-page.tsx`)

```json
{
  "cart": {
    "title": "Shopping Cart",
    "empty": {
      "title": "Your cart is empty",
      "subtitle": "Discover our beautiful gemstones",
      "continueShopping": "Continue Shopping",
      "signInRequired": "Sign In Required",
      "signInMessage": "Please sign in to view and manage your shopping cart."
    },
    "items": {
      "selectAll": "Select All",
      "quantity": "Quantity",
      "price": "Price",
      "total": "Total",
      "remove": "Remove",
      "update": "Update"
    },
    "summary": {
      "title": "Order Summary",
      "subtotal": "Subtotal ({count} items)",
      "shipping": "Shipping",
      "tax": "Tax",
      "total": "Total",
      "calculatedAtCheckout": "Calculated at checkout",
      "selectedItemsTotal": "Showing total for {count} selected item(s)"
    },
    "actions": {
      "clearCart": "Clear Cart",
      "clearing": "Clearing...",
      "checkout": "Order {count} Item(s)",
      "processing": "Processing Order...",
      "tryAgain": "Try Again"
    },
    "loading": "Loading your cart...",
    "error": "Error loading cart"
  }
}
```

### **Cart Item** (`src/features/cart/components/cart-item.tsx`)

```json
{
  "cartItem": {
    "quantity": "Quantity",
    "price": "Price",
    "total": "Total",
    "remove": "Remove from cart",
    "update": "Update quantity"
  }
}
```

---

## 👨‍💼 **5. ADMIN PANEL STRINGS** 🟡 **HIGH**

### **Admin Dashboard** (`src/features/admin/components/admin-dashboard.tsx`)

```json
{
  "admin": {
    "dashboard": {
      "title": "Admin Dashboard",
      "welcome": "Welcome to the admin panel",
      "totalGemstones": "Total Gemstones",
      "activeUsers": "Active Users",
      "totalOrders": "Total Orders",
      "revenue": "Revenue"
    },
    "navigation": {
      "gemstones": "Gemstones",
      "users": "Users",
      "orders": "Orders",
      "analytics": "Analytics",
      "settings": "Settings"
    }
  }
}
```

### **Gemstone Management** (`src/features/admin/components/gemstone-list.tsx`)

```json
{
  "admin": {
    "gemstones": {
      "title": "Gemstone Management",
      "search": "Search gemstones...",
      "addNew": "Add New Gemstone",
      "edit": "Edit",
      "delete": "Delete",
      "view": "View Details",
      "duplicate": "Duplicate",
      "archive": "Archive",
      "restore": "Restore",
      "export": "Export",
      "import": "Import",
      "bulkEdit": "Bulk Edit",
      "noGemstones": "No gemstones yet",
      "noResults": "No gemstones found",
      "loading": "Loading gemstones...",
      "exportCsv": "Export CSV",
      "exportPdf": "Export PDF",
      "exporting": "Exporting...",
      "inStock": "In Stock",
      "outOfStock": "Out of Stock"
    }
  }
}
```

### **Enhanced Search** (`src/features/admin/components/enhanced-search.tsx`)

```json
{
  "admin": {
    "search": {
      "placeholder": "Search gemstones by serial number, type, color, or description...",
      "sortBy": "Sort by",
      "filters": "Filters",
      "clearFilters": "Clear All Filters",
      "activeFilters": "Active Filters ({count})",
      "saveSearch": "Save Search",
      "loadSearch": "Load Search",
      "deleteSearch": "Delete Search",
      "searchName": "Search Name",
      "savedSearches": "Saved Searches",
      "advancedFilters": "Advanced Filters"
    }
  }
}
```

---

## 📄 **6. FOOTER & LEGAL STRINGS** 🟢 **MEDIUM**

### **Footer** (`src/shared/components/layout/footer.tsx`)

```json
{
  "footer": {
    "company": {
      "name": "Smaragdus Viridi",
      "description": "Your trusted partner in premium gemstone trading...",
      "contact": {
        "email": "info@smaragdus-viridi.com",
        "phone": "+1 (555) 123-4567"
      }
    },
    "sections": {
      "company": "Company",
      "products": "Products",
      "support": "Support",
      "legal": "Legal"
    },
    "links": {
      "company": {
        "about": "About Us",
        "contact": "Contact",
        "careers": "Careers",
        "press": "Press"
      },
      "products": {
        "catalog": "Gemstone Catalog",
        "certification": "Certification",
        "customOrders": "Custom Orders",
        "bulkPricing": "Bulk Pricing"
      },
      "support": {
        "help": "Help Center",
        "shipping": "Shipping Info",
        "returns": "Returns",
        "sizeGuide": "Size Guide"
      },
      "legal": {
        "privacy": "Privacy Policy",
        "terms": "Terms of Service",
        "cookies": "Cookie Policy"
      }
    },
    "copyright": "© {year} Smaragdus Viridi. All rights reserved."
  }
}
```

---

## 📝 **7. FORM & VALIDATION STRINGS** 🟡 **HIGH**

### **Common Form Elements**

```json
{
  "forms": {
    "labels": {
      "name": "Name",
      "email": "Email",
      "password": "Password",
      "confirmPassword": "Confirm Password",
      "phone": "Phone",
      "address": "Address",
      "city": "City",
      "state": "State",
      "zipCode": "ZIP Code",
      "country": "Country",
      "message": "Message",
      "comments": "Comments"
    },
    "placeholders": {
      "enterName": "Enter your name",
      "enterEmail": "Enter your email",
      "enterPassword": "Enter your password",
      "confirmPassword": "Confirm your password",
      "enterPhone": "Enter your phone number",
      "enterAddress": "Enter your address",
      "enterCity": "Enter your city",
      "enterMessage": "Enter your message"
    },
    "buttons": {
      "submit": "Submit",
      "send": "Send",
      "save": "Save",
      "update": "Update",
      "cancel": "Cancel",
      "close": "Close",
      "back": "Back",
      "next": "Next",
      "previous": "Previous",
      "continue": "Continue"
    }
  }
}
```

### **Validation Messages**

```json
{
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email address",
    "password": {
      "minLength": "Password must be at least 8 characters",
      "uppercase": "Password must contain at least one uppercase letter",
      "lowercase": "Password must contain at least one lowercase letter",
      "number": "Password must contain at least one number"
    },
    "phone": "Please enter a valid phone number",
    "name": "Please enter your full name",
    "match": "Passwords do not match"
  }
}
```

---

## ⚠️ **8. ERROR MESSAGES** 🟡 **HIGH**

### **Common Errors**

```json
{
  "errors": {
    "general": {
      "somethingWentWrong": "Something went wrong. Please try again.",
      "networkError": "Network error. Please check your connection.",
      "serverError": "Server error. Please try again later.",
      "timeout": "Request timed out. Please try again.",
      "unauthorized": "You are not authorized to perform this action.",
      "forbidden": "Access denied.",
      "notFound": "The requested resource was not found.",
      "validationError": "Please check your input and try again."
    },
    "auth": {
      "invalidCredentials": "Invalid email or password.",
      "accountDisabled": "Your account has been disabled.",
      "emailNotVerified": "Please verify your email address.",
      "tooManyAttempts": "Too many login attempts. Please try again later.",
      "sessionExpired": "Your session has expired. Please sign in again."
    },
    "cart": {
      "itemNotAvailable": "This item is no longer available.",
      "insufficientStock": "Insufficient stock for this item.",
      "cartEmpty": "Your cart is empty.",
      "maximumItems": "Maximum cart items reached."
    },
    "payment": {
      "paymentFailed": "Payment failed. Please try again.",
      "cardDeclined": "Card was declined.",
      "insufficientFunds": "Insufficient funds.",
      "expiredCard": "Card has expired."
    }
  }
}
```

---

## 🎨 **9. UI COMPONENT STRINGS** 🟢 **MEDIUM**

### **Buttons & Actions**

```json
{
  "ui": {
    "buttons": {
      "ok": "OK",
      "yes": "Yes",
      "no": "No",
      "confirm": "Confirm",
      "delete": "Delete",
      "edit": "Edit",
      "view": "View",
      "close": "Close",
      "open": "Open",
      "expand": "Expand",
      "collapse": "Collapse",
      "showMore": "Show More",
      "showLess": "Show Less",
      "loadMore": "Load More"
    },
    "status": {
      "loading": "Loading...",
      "processing": "Processing...",
      "saving": "Saving...",
      "deleting": "Deleting...",
      "updating": "Updating...",
      "success": "Success",
      "error": "Error",
      "warning": "Warning",
      "info": "Information"
    },
    "navigation": {
      "previous": "Previous",
      "next": "Next",
      "first": "First",
      "last": "Last",
      "page": "Page {current} of {total}"
    }
  }
}
```

---

## 💎 **10. GEMSTONE-SPECIFIC TERMINOLOGY** 🔴 **CRITICAL**

### **Gemstone Types** (Industry Standard)

```json
{
  "gemstones": {
    "types": {
      "diamond": "Diamond / Бриллиант",
      "emerald": "Emerald / Изумруд",
      "ruby": "Ruby / Рубин",
      "sapphire": "Sapphire / Сапфир",
      "amethyst": "Amethyst / Аметист",
      "topaz": "Topaz / Топаз",
      "garnet": "Garnet / Гранат",
      "peridot": "Peridot / Перидот",
      "citrine": "Citrine / Цитрин",
      "tanzanite": "Tanzanite / Танзанит"
    }
  }
}
```

### **Quality Characteristics**

```json
{
  "gemstones": {
    "quality": {
      "cut": {
        "excellent": "Excellent / Отличная",
        "veryGood": "Very Good / Очень хорошая",
        "good": "Good / Хорошая",
        "fair": "Fair / Удовлетворительная",
        "poor": "Poor / Плохая"
      },
      "color": {
        "d": "D (Colorless) / D (Бесцветный)",
        "e": "E (Colorless) / E (Бесцветный)",
        "f": "F (Colorless) / F (Бесцветный)",
        "g": "G (Near Colorless) / G (Почти бесцветный)",
        "h": "H (Near Colorless) / H (Почти бесцветный)"
      },
      "clarity": {
        "fl": "FL (Flawless) / FL (Безупречный)",
        "if": "IF (Internally Flawless) / IF (Внутренне безупречный)",
        "vvs1": "VVS1 (Very Very Slightly Included) / VVS1",
        "vvs2": "VVS2 (Very Very Slightly Included) / VVS2",
        "vs1": "VS1 (Very Slightly Included) / VS1",
        "vs2": "VS2 (Very Slightly Included) / VS2"
      }
    }
  }
}
```

### **Certifications**

```json
{
  "certifications": {
    "gia": "GIA (Gemological Institute of America)",
    "ags": "AGS (American Gem Society)",
    "sse": "SSEF (Swiss Gemmological Institute)",
    "egl": "EGL (European Gemological Laboratory)",
    "igi": "IGI (International Gemological Institute)"
  }
}
```

---

## 📊 **11. SUMMARY STATISTICS**

### **Translation Volume**

- **Total estimated strings**: 305-440
- **High priority (Week 1-2)**: 125-155 strings (Navigation, Auth, Cart, Core Catalog)
- **Medium priority (Week 3-4)**: 110-145 strings (Admin, Forms, Filters)
- **Low priority (Week 5+)**: 70-140 strings (Legal, Advanced features)

### **Content Categories**

| Category        | Count  | Priority    | Notes                      |
| --------------- | ------ | ----------- | -------------------------- |
| UI Labels       | 80-100 | 🔴 Critical | Navigation, buttons, forms |
| Business Terms  | 40-60  | 🔴 Critical | Gemstone terminology       |
| Error Messages  | 30-40  | 🟡 High     | User feedback              |
| Admin Interface | 80-100 | 🟡 High     | Management functions       |
| Legal Content   | 20-25  | 🟢 Medium   | Policies, terms            |
| Marketing Copy  | 25-35  | 🟢 Medium   | Descriptions, CTAs         |
| SEO Content     | 15-20  | 🟢 Low      | Meta tags, alt text        |

### **Technical Considerations**

- **Pluralization**: Russian has complex plural rules
- **Date/Time**: Different formatting standards
- **Currency**: USD primary, RUB support needed
- **Numbers**: Different decimal separators
- **Cultural Adaptation**: Business formality levels

---

## 🎯 **NEXT STEPS**

### **Immediate Actions**

1. **Install i18n libraries** (next-intl)
2. **Create translation structure** based on this inventory
3. **Begin with high-priority strings** (Navigation, Auth, Cart)
4. **Set up translation workflow** with professional translators

### **Quality Gates**

- [ ] **Completeness**: All identified strings have translations
- [ ] **Consistency**: Same terms translated identically
- [ ] **Cultural**: Appropriate for Russian jewelry market
- [ ] **Technical**: Proper pluralization and formatting
- [ ] **SEO**: Russian keywords and meta descriptions

---

## 📋 **CHANGE LOG**

| Version | Date     | Changes                                         | Author       |
| ------- | -------- | ----------------------------------------------- | ------------ |
| 1.0     | Jan 2025 | Initial comprehensive translation inventory     | AI Assistant |
| -       | -        | Cataloged 305-440 strings across 53 files       | -            |
| -       | -        | Prioritized by business impact and user journey | -            |
| -       | -        | Included gemstone industry terminology          | -            |
| -       | -        | Russian market cultural considerations          | -            |

---

**📝 Document Status**: 🔄 ACTIVE | **Next Review**: After i18n implementation begins | **Owner**: Development Team\*\*

**🎯 Mission**: Comprehensive Russian localization enabling professional gemstone e-commerce in Russian market with industry-appropriate terminology and cultural adaptation.
