import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import type { User, BharatDocument, TokenResponse } from './types';

type View = 'landing' | 'auth' | 'profile' | 'dashboard' | 'chat';

interface ChatCtx {
  document: BharatDocument | null;
  conversationId: string | null;
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem('bs_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function loadToken(): string | null {
  return localStorage.getItem('bs_token');
}

export default function App() {
  const [view, setView] = useState<View>(() => {
    const token = loadToken();
    const user = loadUser();
    return token && user ? 'dashboard' : 'landing';
  });
  const [user, setUser] = useState<User | null>(loadUser);
  const [chatCtx, setChatCtx] = useState<ChatCtx>({ document: null, conversationId: null });
  // First-login onboarding: show the role-based profile once, then remember
  const [profileCompleted, setProfileCompleted] = useState<boolean>(
    () => localStorage.getItem('bs_profile_done') === '1'
  );

  // Keep user in sync
  useEffect(() => {
    if (user) localStorage.setItem('bs_user', JSON.stringify(user));
  }, [user]);

  function handleAuthSuccess(_token: string, data: TokenResponse, isRegister: boolean) {
    const u: User = {
      id: data.user_id,
      name: data.name,
      email: data.email,
      preferred_language: data.preferred_language,
      role: data.role,
      created_at: new Date().toISOString(),
    };
    setUser(u);
    // Fresh registrations always see the role-based profile page first;
    // logins skip it once the profile has been completed before.
    setView(isRegister || !profileCompleted ? 'profile' : 'dashboard');
  }

  function handleLogout() {
    localStorage.removeItem('bs_token');
    localStorage.removeItem('bs_user');
    setUser(null);
    setView('landing');
  }

  function handleStartChat(doc: BharatDocument | null, convId?: string) {
    setChatCtx({ document: doc, conversationId: convId || null });
    setView('chat');
  }

  function handleProfileDone() {
    localStorage.setItem('bs_profile_done', '1');
    setProfileCompleted(true);
    setView('dashboard');
  }

  if (view === 'landing') {
    return <LandingPage onGetStarted={() => setView('auth')} />;
  }

  if (view === 'auth') {
    return (
      <AuthPage
        onSuccess={handleAuthSuccess}
        onBack={() => setView('landing')}
      />
    );
  }

  if (view === 'profile' && user) {
    return (
      <ProfilePage
        user={user}
        onBack={() => setView('landing')}
        onContinue={handleProfileDone}
        onUserUpdate={setUser}
      />
    );
  }

  if (view === 'chat' && user) {
    return (
      <ChatPage
        user={user}
        document={chatCtx.document}
        conversationId={chatCtx.conversationId}
        onBack={() => setView('dashboard')}
        onUserUpdate={setUser}
      />
    );
  }

  if (view === 'dashboard' && user) {
    return (
      <DashboardPage
        user={user}
        onStartChat={handleStartChat}
        onLogout={handleLogout}
        onUserUpdate={setUser}
        onOpenProfile={() => setView('profile')}
      />
    );
  }

  // Fallback: redirect to landing
  return <LandingPage onGetStarted={() => setView('auth')} />;
}
