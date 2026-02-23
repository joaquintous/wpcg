'use client';

import { useState, useEffect } from 'react';
import type { GeneratedContent } from '@/lib/types';
import { ContentGenerator } from '@/components/content-generator';
import { ContentPreview } from '@/components/content-preview';
import { useUser, useAuth, useLanguage } from '@/firebase';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { History, LogOut, Languages, Shield, Loader2, AlertCircle } from 'lucide-react';
import { HistoryDialog } from '@/components/history-dialog';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [contentSource, setContentSource] = useState<'comment' | 'photo' | 'improve' | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const { user, loading: userLoading, signOut } = useUser();
  const auth = useAuth();
  const { t, setLanguage, language } = useLanguage();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Error during sign-in:", error);
    }
  };
  
  useEffect(() => {
    if (!auth) {
      setIsProcessingRedirect(false);
      return;
    }
  
    // This function is designed to only run once.
    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        const currentUser = auth.currentUser;
        
        let debugInfo = {
          hasResult: !!result,
          resultUser: result ? { uid: result.user.uid, email: result.user.email } : null,
          currentUserAfterResult: currentUser ? { uid: currentUser.uid, email: currentUser.email } : null,
          timestamp: new Date().toUTCString(),
        };

        if (result && !currentUser) {
          // This is the classic "unauthorized domain" case.
          const errorMessage = `Authentication Debugging:\nLogin redirect was processed, but the user session could not be verified.\nThis almost always means the domain is not authorized in Firebase.\n\nDebug Info:\n${JSON.stringify(debugInfo, null, 2)}`;
          setAuthError(errorMessage);
        } else if (!result && !currentUser) {
            // This is a normal page load, no user is logged in. No error.
        }

      } catch (error: any) {
        const errorInfo = {
          code: error.code,
          message: error.message,
          timestamp: new Date().toUTCString(),
        };
        const errorMessage = `Authentication Debugging:\nAn error occurred while processing the login redirect.\n\nError Details:\n${JSON.stringify(errorInfo, null, 2)}`;
        setAuthError(errorMessage);
      } finally {
        // No matter what, we stop processing.
        setIsProcessingRedirect(false);
      }
    };
  
    // We only run this once. The `isProcessingRedirect` flag prevents re-runs.
    if(isProcessingRedirect){
        processRedirect();
    }

  }, [auth, isProcessingRedirect]);


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
  
  const isLoading = userLoading || isProcessingRedirect;

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
          {authError ? (
             <div className="flex h-[60vh] flex-col items-center justify-center text-center">
                <AlertCircle className="h-16 w-16 text-destructive" />
                <h1 className="mt-6 text-3xl font-bold text-destructive">Authentication Error</h1>
                <pre className="mt-4 max-w-4xl whitespace-pre-wrap rounded-md border border-destructive bg-destructive/10 p-4 text-left font-mono text-sm text-foreground">
                  {authError}
                </pre>
                <Button size="lg" className="mt-8" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
            </div>
          ) : isLoading ? (
            <div className="flex h-[60vh] flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Verifying session...</p>
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
