# Site Map & Information Architecture

## Root Navigation
- `/` — Главная страница (Home)
  - Displays:
    - Новинки (New Arrivals)
    - Краткое описание
    - Ссылки: каталог, контакты, украшение на заказ, чат, избранное, корзина, профиль

- `/catalog` — Каталог
  - Sidebar with filters:
    - Цвет (Color)
    - Название (Mineral Type)
    - Цена (Price Range Slider)
    - Огранка (Cut Style)
    - Месторождение (Origin)
  - Main view: Product grid

- `/stone/[id]` — Страница товара
  - Details:
    - Название, вес, размеры, сертификация, наличие
    - Кнопки: ❤ (Избранное), 🛒 (В корзину)
    - Медиа: фото, видео
    - Дополнительно:
      - Скачать все медиа
      - Визуализация на пальце
      - Перейти к оформлению

- `/favorites` — Избранное
- `/cart` — Корзина
- `/checkout` — Оформление и оплата
- `/login` — Вход / Регистрация
  - `/login/register`
- `/account` — Профиль пользователя

- `/custom` — Украшение на заказ
  - Text + steps for custom jewelry production
  - CTA: Перейти в чат

- `/chat` — Чат с администрацией
  - Accessible via floating icon on all pages

## Admin Area (protected routes)
- `/admin/login`
- `/admin/dashboard`
- `/admin/products`
- `/admin/orders`
- `/admin/customers`
- `/admin/chat`

## Global UI Components
- Fixed top bar with:
  - Logo (links to `/`)
  - Cart icon
  - Favorites icon
  - Currency switcher
  - Chat icon
  - Profile dropdown

## Optional Future Routes
- `/visualizer` — Fullscreen finger visualizer
- `/downloads/[stone-id]` — Серийная загрузка файлов
- `/referrals` — Реферальная система

## Access Levels
| Page/Route              | Guest | Registered | Admin |
|------------------------|-------|------------|--------|
| `/`                    | ✅     | ✅          | ✅      |
| `/catalog`             | ✅     | ✅          | ✅      |
| `/stone/[id]`          | ✅     | ✅          | ✅      |
| `/favorites`           | ⚠️    | ✅          | ✅      |
| `/cart`                | ✅     | ✅          | ✅      |
| `/checkout`            | ✅     | ✅          | ✅      |
| `/login`               | ✅     | ✅          | ✅      |
| `/admin/*`             | ❌    | ❌          | ✅      |

