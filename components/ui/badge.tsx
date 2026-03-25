import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-orange-700/50 bg-orange-900/30 text-orange-300',
        secondary: 'border-[#2a2f3e] bg-[#1a1f2e] text-gray-300',
        destructive: 'border-red-700/50 bg-red-900/30 text-red-300',
        outline: 'border-[#2a2f3e] text-gray-300',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
