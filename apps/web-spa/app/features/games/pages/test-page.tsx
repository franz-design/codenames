import { WordCard } from '../components/WordCard'

export default function TestPage() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="grid grid-cols-5 gap-4">
        <WordCard word="Camion" />
        <WordCard word="Camion" />
        <WordCard word="Camion" />
        <WordCard word="Camion" />
        <WordCard word="Camion" />
        <WordCard word="Camion" />
        <WordCard word="Camion" />
      </div>
    </div>
  )
}
