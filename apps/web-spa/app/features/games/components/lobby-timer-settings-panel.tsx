import type { GameTimerSettings } from '../types'
import { Input } from '@codenames/ui/components/primitives/input'
import { Label } from '@codenames/ui/components/primitives/label'
import { Switch } from '@codenames/ui/components/primitives/switch'
import { ClockIcon } from '@codenames/ui/icons'
import { cn } from '@codenames/ui/lib/utils'
import { useState } from 'react'

interface LobbyTimerSettingsPanelProps {
  timerSettings: GameTimerSettings
  onTimerChange: (settings: GameTimerSettings) => void
}

function clampDurationSecondsFromMinutes(minutes: number): number {
  return Math.min(3600, Math.max(60, minutes * 60))
}

export function LobbyTimerSettingsPanel({
  timerSettings,
  onTimerChange,
}: LobbyTimerSettingsPanelProps) {
  const [timerEnabled, setTimerEnabled] = useState(timerSettings.isEnabled)
  const [durationMinutes, setDurationMinutes] = useState(() =>
    Math.min(60, Math.max(1, Math.round(timerSettings.durationSeconds / 60))),
  )

  const emitSettings = (isEnabled: boolean, minutes: number): void => {
    onTimerChange({
      isEnabled,
      durationSeconds: clampDurationSecondsFromMinutes(minutes),
    })
  }

  return (
    <div className="flex items-center justify-between gap-4 border border-primary-border py-3 px-3 rounded-md">
      <div className="flex items-center gap-4">
        <div className={cn('flex items-center gap-1', timerEnabled ? 'text-primary-foreground' : 'text-muted-foreground')}>
          <ClockIcon className="w-4 h-4" />
          <Label htmlFor="game-timer-enabled" className="text-sm font-medium">
            Timer
          </Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            id="game-timer-minutes"
            type="number"
            min={1}
            max={60}
            className="w-16"
            aria-describedby="game-timer-minutes-suffix"
            value={durationMinutes}
            onChange={(e) => {
              const parsed = Number.parseInt(e.target.value, 10) || 1
              const clamped = Math.min(60, Math.max(1, parsed))
              setDurationMinutes(clamped)
              emitSettings(timerEnabled, clamped)
            }}
            disabled={!timerEnabled}
          />
          <span
            id="game-timer-minutes-suffix"
            className="shrink-0 text-sm text-muted-foreground"
          >
            minutes
          </span>
        </div>
      </div>
      <Switch
        id="game-timer-enabled"
        checked={timerEnabled}
        onCheckedChange={(checked) => {
          setTimerEnabled(checked)
          emitSettings(checked, durationMinutes)
        }}
      />
    </div>
  )
}
