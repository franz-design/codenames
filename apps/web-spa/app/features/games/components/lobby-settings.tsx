import type { AppliedCustomWordPool, GameTimerSettings, GameWordPackSlug } from '../types'
import { LobbyTimerSettingsPanel } from './lobby-timer-settings-panel'
import { LobbyWordPackPanel } from './lobby-word-pack-panel'

interface LobbySettingsProps {
  timerSettings: GameTimerSettings
  onTimerChange: (settings: GameTimerSettings) => void
  wordPack: GameWordPackSlug
  customPool: AppliedCustomWordPool | null
  onWordPackChange: (wordPack: GameWordPackSlug) => void
  onApplyCustomPool: (pool: AppliedCustomWordPool) => void
}

export function LobbySettings({
  timerSettings,
  onTimerChange,
  wordPack,
  customPool,
  onWordPackChange,
  onApplyCustomPool,
}: LobbySettingsProps) {
  return (
    <div className="flex flex-col gap-4">
      <LobbyWordPackPanel
        wordPack={wordPack}
        customPool={customPool}
        onWordPackChange={onWordPackChange}
        onApplyCustomPool={onApplyCustomPool}
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
