import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Png404 from './ui/svg-404'

const ErrorPage = () => {
  return (
    <div className='flex flex-col items-center justify-center gap-6 py-12 h-full'>
        <div>
            <Png404 />
        </div>

        <div className='flex flex-col items-center gap-2'>
            <h1 className='text-3xl font-bold'>Oups... Page non trouvée</h1>
            <p className='text-muted-foreground'>La page que vous cherchez n'existe pas.</p>
            <Button  onClick={() => window.history.back()}><ChevronLeft /> Retour à la page précédente</Button>
        </div>
    </div>
  )
}

export default ErrorPage
