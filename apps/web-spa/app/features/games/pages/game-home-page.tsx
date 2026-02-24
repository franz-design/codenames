import { Button } from '@codenames/ui/components/primitives/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@codenames/ui/components/primitives/card'
import { Link } from 'react-router'

export default function GameHomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Codenames</h1>
          <p className="mt-2 text-muted-foreground">
            Créez une partie ou rejoignez une partie existante
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nouvelle partie</CardTitle>
            <CardDescription>
              Créez une partie et partagez le code avec vos amis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
              <Link to="/games/new">Créer une partie</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rejoindre une partie</CardTitle>
            <CardDescription>
              Entrez le code de la partie pour rejoindre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link to="/games/join">Rejoindre une partie</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
