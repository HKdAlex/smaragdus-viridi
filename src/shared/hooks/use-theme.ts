"use client"

import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface UseThemeReturn {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export function useTheme(): UseThemeReturn {
  // Always start with same state on server and client to prevent hydration mismatch
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Get system preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [])

  // Resolve theme based on user preference and system setting
  const resolveTheme = useCallback((themeValue: Theme): 'light' | 'dark' => {
    if (themeValue === 'system') {
      return getSystemTheme()
    }
    return themeValue
  }, [getSystemTheme])

  // Apply theme to document
  const applyTheme = useCallback((resolvedTheme: 'light' | 'dark') => {
    if (typeof window === 'undefined') return

    const root = window.document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    // Add new theme class
    root.classList.add(resolvedTheme)
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff'
      )
    }
  }, [])

  // Set theme and persist preference
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-preference', newTheme)
    }
    
    // Resolve and apply theme
    const resolved = resolveTheme(newTheme)
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [resolveTheme, applyTheme])

  // Toggle between light and dark (ignoring system)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }, [resolvedTheme, setTheme])

  // Initialize client-side state after hydration
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    setMounted(true)
    
    // Load saved preference and apply it
    const savedTheme = localStorage.getItem('theme-preference') as Theme | null
    const initialTheme = savedTheme || 'system'
    
    setThemeState(initialTheme)
    const resolved = resolveTheme(initialTheme)
    setResolvedTheme(resolved)
    
    // Theme is already applied by script, but ensure consistency
    applyTheme(resolved)
  }, [resolveTheme, applyTheme, setMounted])

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !mounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        const newResolved = getSystemTheme()
        setResolvedTheme(newResolved)
        applyTheme(newResolved)
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [theme, getSystemTheme, applyTheme, mounted])

  return {
    theme,
    resolvedTheme: mounted ? resolvedTheme : 'light', // Always show light until mounted
    setTheme,
    toggleTheme,
  }
} 