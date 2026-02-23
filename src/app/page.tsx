'use client';

import { useState } from 'react';
import type { GeneratedContent } from '@/lib/types';
import { ContentGenerator } from '@/components/content-generator';
import { ContentPreview } from '@/components/content-preview';
import { useUser, useAuth, useLanguage } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { History, LogOut, Languages, Shield, Loader2 } from 'lucide-react';
import { HistoryDialog } from '@/components/history-dialog';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [contentSource, setContentSource] = useState<'comment' | 'photo' | 'improve' | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { user, loading: userLoading, signOut } = useUser();
  const auth = useAuth();
  const { t, setLanguage, language } = useLanguage();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Error de Inicialización',
        description: 'El objeto de autenticación de Firebase no está disponible.',
        duration: 20000,
      });
      return;
    }

    const provider = new GoogleAuthProvider();
    toast({
      title: 'Iniciando sesión...',
      description: 'Abriendo la ventana emergente de Google. Por favor, espere.',
      duration: 5000,
    });

    try {
      const result = await signInWithPopup(auth, provider);
      // If we get here, the popup was successful from Firebase's perspective
      toast({
        variant: 'default',
        title: '¡Autenticación con Google exitosa!',
        description: `Bienvenido, ${result.user.displayName}. Verificando estado final...`,
        duration: 10000,
      });
      // The onAuthStateChanged listener in useUser should now handle the rest.
      // The UI should update automatically. If it doesn't, the problem is in the state update flow.
    } catch (error: any) {
      console.error('Error detallado durante signInWithPopup:', error);
      // Create a super detailed error message
      const errorMessage = `Código: ${error.code}\nMensaje: ${error.message}`;
      toast({
        variant: 'destructive',
        title: 'Error durante el inicio de sesión',
        description: (
          <pre className="mt-2 w-full whitespace-pre-wrap rounded-md bg-slate-950 p-4">
            <code className="text-white">{errorMessage}</code>
          </pre>
        ),
        duration: 20000,
      });
    }
  };

  const handleContentGenerated = (content: GeneratedContent, source: 'comment' | 'photo' | 'improve', photoUrl?: string) => {
    setGeneratedContent(content);
    setContentSource(source);
    if (photoUrl) {
      setPhotoPreview(photoUrl);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleReset = () => {
    setGeneratedContent(null);
    setContentSource(null);
    setPhotoPreview(null);
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0][0];
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
          {userLoading ? (
             <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setHistoryOpen(true)}>
                <History className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                      <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                     <Link href="/admin"><Shield className="mr-2 h-4 w-4" /><span>{t('adminPanel')}</span></Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
             <Button onClick={handleLogin}>{t('login')}</Button>
          )}
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
        <div className="container py-8">
          {userLoading ? (
            <div className="flex h-[60vh] flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Verificando sesión...</p>
            </div>
          ) : !user ? (
            <div className="flex h-[60vh] flex-col items-center justify-center text-center">
              <h1 className="text-4xl font-bold tracking-tight">{t('welcome')}</h1>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                {t('loginToContinue')}
              </p>
              <Button size="lg" className="mt-8" onClick={handleLogin}>
                {t('login')}
              </Button>
            </div>
          ) : generatedContent ? (
            <ContentPreview
              content={generatedContent}
              onReset={handleReset}
              source={contentSource}
              photoPreview={photoPreview}
            />
          ) : (
            <ContentGenerator onContentGenerated={handleContentGenerated} />
          )}
        </div>
      </main>
      
      <footer className="border-t">
        <div className="container flex h-14 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('footerText')}</p>
        </div>
      </footer>
      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}
