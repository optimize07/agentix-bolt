import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import { useTheme, generateGradientCSS } from "@/contexts/ThemeContext";

interface AppLayoutProps {
  children: ReactNode;
  saveStatus?: {
    state: 'idle' | 'saving' | 'saved' | 'error';
    lastSaved?: Date;
    error?: string;
  };
}

export const AppLayout = ({ children, saveStatus }: AppLayoutProps) => {
  const { effectiveMode, lightBackgroundConfig, darkBackgroundConfig, lightColors, darkColors } = useTheme();
  
  // Safe guards for undefined values during initialization
  if (!lightBackgroundConfig || !darkBackgroundConfig || !lightColors || !darkColors) {
    return (
      <div className="min-h-screen flex overflow-hidden bg-background">
        <Sidebar saveStatus={saveStatus} />
        <main className="flex-1 ml-64">
          {children}
        </main>
      </div>
    );
  }
  
  const bgConfig = effectiveMode === 'dark' ? darkBackgroundConfig : lightBackgroundConfig;
  const colors = effectiveMode === 'dark' ? darkColors : lightColors;
  
  const backgroundStyle = bgConfig?.gradient?.enabled
    ? { background: generateGradientCSS(bgConfig.gradient) }
    : { backgroundColor: colors?.background };

  return (
    <div className="min-h-screen flex overflow-hidden" style={backgroundStyle}>
      <Sidebar saveStatus={saveStatus} />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
};
