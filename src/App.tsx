import React, { useState, useEffect } from 'react';
import { User } from './types';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Recognition } from './components/Recognition';
import { Registration } from './components/Registration';
import { StudentManagement } from './components/StudentManagement';
import { TeacherManagement } from './components/TeacherManagement';
import { AttendanceModule } from './components/AttendanceModule';
import { ReportsModule } from './components/ReportsModule';
import { AnalyticsModule } from './components/AnalyticsModule';
import { SettingsModule } from './components/SettingsModule';
import { LoginModal } from './components/LoginModal';
import { NotificationsModule } from './components/NotificationsModule';
import { StudentProfileModule } from './components/StudentProfileModule';
import { LeaveRequestModule } from './components/LeaveRequestModule';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Restore session from localStorage if available
  useEffect(() => {
    const savedUser = localStorage.getItem('smartface_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse saved session:', err);
      }
    }
  }, []);

  // Sync dark mode class on <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('smartface_user', JSON.stringify(user));
    localStorage.setItem('smartface_token', token);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('smartface_user');
    localStorage.removeItem('smartface_token');
  };

  if (!currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Navigation Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenKiosk={() => setActiveTab('recognition')}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={currentUser.role}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <Dashboard currentUser={currentUser} onNavigate={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'recognition' && <Recognition />}

          {activeTab === 'registration' && currentUser.role === 'ADMIN' && <Registration />}

          {activeTab === 'students' && (
            <StudentManagement
              userRole={currentUser.role}
              onNavigateRegister={() => setActiveTab('registration')}
            />
          )}

          {activeTab === 'teachers' && currentUser.role === 'ADMIN' && <TeacherManagement />}

          {activeTab === 'attendance' && <AttendanceModule userRole={currentUser.role} />}

          {activeTab === 'reports' && <ReportsModule userRole={currentUser.role} />}

          {activeTab === 'analytics' && currentUser.role !== 'STUDENT' && <AnalyticsModule />}
          
          {activeTab === 'notifications' && currentUser.role === 'STUDENT' && <NotificationsModule />}
          
          {activeTab === 'profile' && currentUser.role === 'STUDENT' && <StudentProfileModule />}
          
          {activeTab === 'requests' && currentUser.role === 'STUDENT' && <LeaveRequestModule />}

          {activeTab === 'settings' && currentUser.role === 'ADMIN' && (
            <SettingsModule
              currentUser={currentUser}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
