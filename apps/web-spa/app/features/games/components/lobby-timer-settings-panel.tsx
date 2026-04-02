import type { GameTimerSettings } from '../types'
import { Input } from '@codenames/ui/components/primitives/input'
import { Label } from '@codenames/ui/components/primitives/label'
import { Switch } from '@codenames/ui/components/primitives/switch'
import { ClockIcon } from '@codenames/ui/icons'
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
  console.log('timerEnabled', timerEnabled)
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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 bg-primary py-1 px-3 rounded-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-primary-foreground">
            <ClockIcon className="w-4 h-4" />
            <Label htmlFor="game-timer-enabled" className="text-base text-primary-foreground">
              Timer
            </Label>
          </div>
          <Input
            id="game-timer-minutes"
            type="number"
            min={1}
            max={60}
            className="w-24"
            value={durationMinutes}
            onChange={(e) => {
              const parsed = Number.parseInt(e.target.value, 10) || 1
              const clamped = Math.min(60, Math.max(1, parsed))
              setDurationMinutes(clamped)
              emitSettings(timerEnabled, clamped)
            }}
            disabled={!timerEnabled}
          />
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
    </div>
  )
}
