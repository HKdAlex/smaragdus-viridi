import type { ComponentProps } from "react";

import { Link } from "./navigation";

/** `href` values accepted by `Link` from `@/i18n/navigation` (locale prefix applied automatically). */
export type AppIntlHref = NonNullable<ComponentProps<typeof Link>["href"]>;
