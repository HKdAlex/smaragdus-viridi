import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'block' | 'inline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  priority?: boolean
}

const sizeConfig = {
  sm: { width: 64, height: 64, src: 'crystallique-logo-256' },
  md: { width: 128, height: 128, src: 'crystallique-logo-512' },
  lg: { width: 256, height: 256, src: 'crystallique-logo-512' },
  xl: { width: 512, height: 512, src: 'crystallique-logo-512' },
}

export function Logo({ 
  variant = 'block', 
  size = 'md', 
  className,
  priority = false 
}: LogoProps) {
  const config = sizeConfig[size]
  const logoName = variant === 'block' ? 'crystallique-logo-block' : 'crystallique-logo-inline'
  
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <Image
        src={`/${logoName}.png`}
        alt="Crystallique - Premium Gemstones"
        width={config.width}
        height={config.height}
        priority={priority}
        className="object-contain"
        sizes={`(max-width: 768px) ${config.width * 0.5}px, ${config.width}px`}
        quality={95}
      />
    </div>
  )
}

// Responsive logo that automatically adjusts size based on screen size
export function ResponsiveLogo({ 
  variant = 'block', 
  className,
  priority = false 
}: Omit<LogoProps, 'size'>) {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <Image
        src={`/crystallique-logo-${variant}.png`}
        alt="Crystallique - Premium Gemstones"
        width={512}
        height={512}
        priority={priority}
        className="object-contain w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32"
        sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, (max-width: 1024px) 96px, 128px"
        quality={95}
      />
    </div>
  )
}

// Logo for specific use cases
export function HeaderLogo({ className }: { className?: string }) {
  return (
    <ResponsiveLogo 
      variant="inline" 
      className={className}
      priority={true}
    />
  )
}

export function FooterLogo({ className }: { className?: string }) {
  return (
    <Logo 
      variant="block" 
      size="md" 
      className={className}
    />
  )
}

export function HeroLogo({ className }: { className?: string }) {
  return (
    <Logo 
      variant="block" 
      size="xl" 
      className={className}
    />
  )
}
