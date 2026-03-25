import { cn } from '@codenames/ui/lib/utils'

export function WordCard({ word }: { word: string }) {
  const baseStyle = 'relative h-32 w-48 flex items-center justify-center [transform-style:preserve-3d]'
  const frontCoverStyle =
    'relative h-32 w-48 flex items-center justify-center [transform-style:preserve-3d] border border-primary-border bg-primary text-primary-foreground font-bold rounded-[12px] transition-card-flip'

  const baseShadowStyle =
    'absolute top-[6px] left-[6px] h-32 w-48 flex items-center justify-center [transform-style:preserve-3d] bg-blue-dark rounded-[14px] transition-colors duration-500 ease-in-out'

  return (
    <div className="group relative perspective-midrange">
      <div
        className={cn(baseShadowStyle, 'bg-black group-hover:bg-blue-dark')}
      />
      <div
        className={cn(
          baseStyle,
          frontCoverStyle,
          'rotate-x-[180deg] border border-blue-dark bg-blue-dark text-transparent',
          'group-hover:rotate-x-[0deg] group-hover:border-primary-border group-hover:bg-primary group-hover:text-primary-foreground',
        )}
      >
        {word}
      </div>
    </div>
  )
}
