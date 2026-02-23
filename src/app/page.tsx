
'use client';

import { useState } from 'react';
import { useUser, useAuth, useLanguage } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, Loader2 } from 'lucide-react';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


export default function Home() {
  const { user, loading: userLoading, error: hookError, signOut } = useUser();
  const auth = useAuth();
  const { t, setLanguage, language } = useLanguage();
  const { toast } = useToast();
  const [popupError, setPopupError] = useState<any>(null);

  const handleLogin = async () => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Error de Inicialización',
        description: 'El objeto de autenticación de Firebase no está disponible.',
      });
      return;
    }

    const provider = new GoogleAuthProvider();
    setPopupError(null);
    toast({
      title: 'Abriendo pop-up de Google...',
      duration: 3000,
    });

    try {
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener in useUser should now handle the state update.
      // We don't need to do anything here. The debug screen will show the result.
      toast({
        title: 'Pop-up cerrado',
        description: 'Esperando actualización de estado del hook useUser...',
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Error detallado durante signInWithPopup:', error);
      setPopupError(error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
       <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex items-center">
            <Icons.logo className="h-6 w-6 mr-2" />
            <span className="font-bold">{t('appTitle')}</span>
          </div>
          <div className="flex-1" />
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2">
                  <Languages className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('language')}</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => setLanguage('en')} disabled={language === 'en'}>English</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLanguage('es')} disabled={language === 'es'}>Español</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-8 space-y-6">
          <h1 className="text-3xl font-bold">Pantalla de Depuración de Autenticación</h1>
          
          <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 p-4 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
            <h3 className="font-semibold">Instrucciones</h3>
            <ol className="mt-2 list-decimal pl-5 text-sm space-y-1">
              <li>Refresca la página en una **nueva ventana de incógnito**.</li>
              <li>Toma una captura de pantalla de esta página **ANTES** de hacer clic en el botón de login.</li>
              <li>Haz clic en "Iniciar Sesión". Completa el proceso en la ventana emergente.</li>
              <li>Después de que la ventana emergente se cierre, espera 5 segundos y toma **OTRA** captura de pantalla de esta página, incluso si no parece haber cambiado nada.</li>
            </ol>
            <p className="mt-3 font-semibold">
                Por favor, envíame ambas capturas. Esto nos mostrará el estado exacto antes y después del intento.
            </p>
          </div>

          <Card>
            <CardHeader><CardTitle>Estado del Hook `useUser`</CardTitle></CardHeader>
            <CardContent className="space-y-2 font-mono text-sm">
              <p><strong>Cargando (userLoading):</strong> {userLoading.toString()}</p>
              <div>
                <strong>Usuario (user):</strong>
                <pre className="mt-1 w-full whitespace-pre-wrap rounded-md bg-slate-100 dark:bg-slate-800 p-2">
                  {user ? JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName }, null, 2) : 'null'}
                </pre>
              </div>
              <p><strong>Error del Hook (hookError):</strong> {hookError ? hookError.message : 'null'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Acción de Login</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {!user && (
                    <Button onClick={handleLogin} disabled={userLoading}>
                        {userLoading ? <Loader2 className="animate-spin" /> : "Iniciar Sesión con Google (Popup)"}
                    </Button>
                )}
                {user && (
                    <Button onClick={signOut}>Cerrar Sesión</Button>
                )}
              </div>

              {popupError && (
                <div>
                  <h3 className="font-bold text-destructive">Error Capturado del Popup:</h3>
                  <pre className="mt-2 w-full whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-white">
                    <code>
                      {JSON.stringify({ code: popupError.code, message: popupError.message }, null, 2)}
                    </code>
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t">
        <div className="container flex h-14 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('footerText')}</p>
        </div>
      </footer>
    </div>
  );
}
