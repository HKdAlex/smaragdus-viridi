// Design tokens for consistent UX across home components
// Keep simple Tailwind-friendly class tokens to avoid runtime style churn

export const radius = "rounded-xl";
export const radiusSm = "rounded-lg";

// Soften shadows to feel premium and restrained
export const shadowSoft = "shadow-md";
export const shadowHover = "shadow-lg";

export const duration = "duration-200";
export const ease = "[cubic-bezier(0.2,0.8,0.2,1)]";

export const gold = "#b68c3a"; // warm gold accent used sparingly

// Optimized for mobile: reduced from py-16 to py-8 on mobile (50% reduction)
// Desktop spacing unchanged for premium feel
export const sectionY = "py-8 sm:py-16 lg:py-24";
