import type { GameTimerSettings, GameWordPackSlug } from '../types'
import { LobbyTimerSettingsPanel } from './lobby-timer-settings-panel'
import { LobbyWordPackPanel } from './lobby-word-pack-panel'

interface LobbySettingsProps {
  timerSettings: GameTimerSettings
  onTimerChange: (settings: GameTimerSettings) => void
  wordPack: GameWordPackSlug
  onWordPackChange: (wordPack: GameWordPackSlug) => void
}

export function LobbySettings({
  timerSettings,
  onTimerChange,
  wordPack,
  onWordPackChange,
}: LobbySettingsProps) {
  return (
    <div className="flex flex-col gap-4">
      <LobbyWordPackPanel
        wordPack={wordPack}
        onWordPackChange={onWordPackChange}
      />
      <LobbyTimerSettingsPanel
        timerSettings={timerSettings}
        onTimerChange={(settings) => {
          onTimerChange(settings)
        }}
      />
    </div>
  )
}
