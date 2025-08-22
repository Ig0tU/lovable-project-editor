
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { NavigationTabs } from '@/components/NavigationTabs';
import { BuildAgent } from '@/components/BuildAgent';
import { DOMInspector } from '@/components/DOMInspector';
import { ChangeHistory } from '@/components/ChangeHistory';
import { TemplateLibrary } from '@/components/TemplateLibrary';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState('build-agent');
  const [isUserscriptMode, setIsUserscriptMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if running as userscript
    const isUserscript = window.location !== window.parent.location || 
                        typeof window.GM_info !== 'undefined' || 
                        document.documentElement.hasAttribute('data-userscript');
    
    setIsUserscriptMode(isUserscript);
    
    if (isUserscript) {
      toast({
        title: "Userscript Mode Active",
        description: "DOM Build Agent is ready to modify this page based on your instructions.",
      });
    }
  }, [toast]);

  const tabs = [
    { id: 'build-agent', name: '🤖 Build Agent', icon: '🤖' },
    { id: 'dom-inspector', name: '🔍 DOM Inspector', icon: '🔍' },
    { id: 'history', name: '📚 Change History', icon: '📚' },
    { id: 'templates', name: '🎨 Quick Templates', icon: '🎨' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <Header isUserscriptMode={isUserscriptMode} />
      
      <div className="container mx-auto px-4 py-6">
        <NavigationTabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        <div className="mt-6">
          {activeTab === 'build-agent' && <BuildAgent />}
          {activeTab === 'dom-inspector' && <DOMInspector />}
          {activeTab === 'history' && <ChangeHistory />}
          {activeTab === 'templates' && <TemplateLibrary />}
        </div>
      </div>
    </div>
  );
};

export default Index;
