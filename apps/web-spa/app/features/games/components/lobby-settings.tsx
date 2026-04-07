import type { GameTimerSettings } from '../types'
import { LobbyTimerSettingsPanel } from './lobby-timer-settings-panel'

interface LobbySettingsProps {
  timerSettings: GameTimerSettings
  onTimerChange: (settings: GameTimerSettings) => void
}

export function LobbySettings({ timerSettings, onTimerChange }: LobbySettingsProps) {
  return (
    <div className="flex flex-col gap-4">
      <LobbyTimerSettingsPanel
        timerSettings={timerSettings}
        onTimerChange={(settings) => {
          onTimerChange(settings)
        }}
      />
    </div>
  )
}
