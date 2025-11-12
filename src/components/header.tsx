'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const baseNavLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
];

export function AppHeader() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const navLinks = user
    ? [...baseNavLinks, { href: '/admin', label: 'Admin' }]
    : [...baseNavLinks];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <Link href="/" className="text-xl font-headline font-bold tracking-tight text-foreground">
          Indiana Art Activist Directory
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {!isUserLoading && navLinks.map(({ href, label }) => (
            <Button key={href} variant="ghost" asChild>
              <Link href={href}>{label}</Link>
            </Button>
          ))}
          {!isUserLoading && (
            user ? (
              <Button variant="ghost" onClick={handleLogout}>Logout</Button>
            ) : (
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
            )
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                  <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    A list of links to navigate the site.
                  </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                {!isUserLoading && navLinks.map(({ href, label }) => (
                  <Button key={href} variant="ghost" asChild className="justify-start text-lg">
                    <Link href={href} onClick={handleLinkClick}>{label}</Link>
                  </Button>
                ))}
                {!isUserLoading && (
                    user ? (
                    <Button variant="ghost" onClick={() => { handleLogout(); handleLinkClick(); }} className="justify-start text-lg">Logout</Button>
                    ) : (
                    <Button variant="ghost" asChild className="justify-start text-lg">
                        <Link href="/login" onClick={handleLinkClick}>Login</Link>
                    </Button>
                    )
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
