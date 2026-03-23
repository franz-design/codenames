import { Button } from '@codenames/ui/components/primitives/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@codenames/ui/components/primitives/card'
import { Link } from 'react-router'

export default function GameHomePage() {
  return (
    <div className="w-full flex gap-8 flex-wrap justify-center items-center">
      <Card className="w-full max-w-md">
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

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Rejoindre une partie</CardTitle>
          <CardDescription>
            Entrez le code de la partie pour rejoindre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" size="lg">
            <Link to="/games/join">Rejoindre une partie</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
