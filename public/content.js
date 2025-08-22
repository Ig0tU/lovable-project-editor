
// Content script for Chrome extension
(function() {
  'use strict';

  class DOMBuildAgent {
    constructor() {
      this.isActive = false;
      this.appContainer = null;
      this.shadowRoot = null;
      this.reactApp = null;
      
      this.init();
    }

    init() {
      // Listen for messages from popup
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        this.handleMessage(request, sender, sendResponse);
        return true; // Keep message channel open for async responses
      });

      // Initialize if extension is already active
      this.checkInitialState();
    }

    async checkInitialState() {
      const isActive = await this.getStorageValue('isActive', false);
      if (isActive) {
        this.activateAgent();
      }
    }

    async handleMessage(request, sender, sendResponse) {
      try {
        switch (request.action) {
          case 'checkStatus':
            sendResponse({ isActive: this.isActive });
            break;

          case 'toggleAgent':
            if (this.isActive) {
              await this.deactivateAgent();
            } else {
              await this.activateAgent();
            }
            sendResponse({ isActive: this.isActive });
            break;

          case 'showInspector':
            await this.showInspector();
            sendResponse({ success: true });
            break;

          case 'showHistory':
            await this.showHistory();
            sendResponse({ success: true });
            break;

          case 'executeCommand':
            await this.executeCommand(request.command);
            sendResponse({ success: true });
            break;

          default:
            sendResponse({ error: 'Unknown action' });
        }
      } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ error: error.message });
      }
    }

    async activateAgent() {
      if (this.isActive) return;

      try {
        // Create container for React app
        this.createAppContainer();
        
        // Load React app
        await this.loadReactApp();
        
        this.isActive = true;
        await this.setStorageValue('isActive', true);
        
        // Show activation notification
        this.showNotification('DOM Build Agent activated! 🚀', 'success');
      } catch (error) {
        console.error('Failed to activate agent:', error);
        this.showNotification('Failed to activate build agent', 'error');
      }
    }

    async deactivateAgent() {
      if (!this.isActive) return;

      try {
        // Remove React app
        if (this.appContainer) {
          this.appContainer.remove();
          this.appContainer = null;
          this.shadowRoot = null;
        }
        
        this.isActive = false;
        await this.setStorageValue('isActive', false);
        
        this.showNotification('DOM Build Agent deactivated', 'info');
      } catch (error) {
        console.error('Failed to deactivate agent:', error);
      }
    }

    createAppContainer() {
      // Remove existing container if it exists
      if (this.appContainer) {
        this.appContainer.remove();
      }

      // Create container with shadow DOM for isolation
      this.appContainer = document.createElement('div');
      this.appContainer.id = 'yootheme-alchemy-suite';
      this.appContainer.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
      `;

      // Create shadow DOM for style isolation
      this.shadowRoot = this.appContainer.attachShadow({ mode: 'closed' });
      
      // Add the container to the page
      document.documentElement.appendChild(this.appContainer);
    }

    async loadReactApp() {
      if (!this.shadowRoot) return;

      // Create root element for React app
      const reactRoot = document.createElement('div');
      reactRoot.id = 'react-root';
      reactRoot.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      // Load CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = chrome.runtime.getURL('assets/index.css');

      // Create the main app HTML structure
      reactRoot.innerHTML = `
        <div id="build-agent-overlay" style="
          position: fixed;
          top: 20px;
          right: 20px;
          width: 400px;
          max-height: 80vh;
          background: rgba(255, 255, 255, 0.98);
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          pointer-events: auto;
          font-size: 14px;
          overflow: hidden;
          transform: translateX(420px);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 2147483647;
        ">
          <div style="
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          ">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">🚀</span>
              <span style="font-weight: 600;">DOM Build Agent</span>
            </div>
            <button id="close-agent" style="
              background: rgba(255, 255, 255, 0.2);
              border: none;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 4px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            ">×</button>
          </div>
          
          <div style="padding: 20px;">
            <div style="margin-bottom: 16px;">
              <input 
                type="text" 
                id="command-input" 
                placeholder="Describe what you want to change..."
                style="
                  width: 100%;
                  padding: 12px 16px;
                  border: 2px solid #e5e7eb;
                  border-radius: 8px;
                  font-size: 14px;
                  outline: none;
                  transition: border-color 0.2s ease;
                "
              />
            </div>
            
            <button id="execute-command" style="
              width: 100%;
              padding: 12px 16px;
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              color: white;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              margin-bottom: 16px;
              transition: transform 0.2s ease;
            ">Execute Command</button>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
              <div style="font-weight: 600; margin-bottom: 12px; color: #374151;">Quick Actions:</div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="quick-action" data-command="Add a banner at the top saying 'Welcome'" style="
                  text-align: left;
                  padding: 8px 12px;
                  background: #f3f4f6;
                  border: 1px solid #d1d5db;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 12px;
                  transition: background-color 0.2s ease;
                ">Add Welcome Banner</button>
                
                <button class="quick-action" data-command="Hide all advertisements" style="
                  text-align: left;
                  padding: 8px 12px;
                  background: #f3f4f6;
                  border: 1px solid #d1d5db;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 12px;
                  transition: background-color 0.2s ease;
                ">Hide Advertisements</button>
                
                <button class="quick-action" data-command="Add floating contact button" style="
                  text-align: left;
                  padding: 8px 12px;
                  background: #f3f4f6;
                  border: 1px solid #d1d5db;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 12px;
                  transition: background-color 0.2s ease;
                ">Add Contact Button</button>
              </div>
            </div>
          </div>
        </div>
        
        <div id="toggle-agent" style="
          position: fixed;
          top: 20px;
          right: 20px;
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 50%;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
          pointer-events: auto;
          z-index: 2147483646;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        ">🚀</div>
      `;

      this.shadowRoot.appendChild(cssLink);
      this.shadowRoot.appendChild(reactRoot);

      // Initialize event listeners
      this.initializeEventListeners();
    }

    initializeEventListeners() {
      const toggleBtn = this.shadowRoot.getElementById('toggle-agent');
      const closeBtn = this.shadowRoot.getElementById('close-agent');
      const executeBtn = this.shadowRoot.getElementById('execute-command');
      const commandInput = this.shadowRoot.getElementById('command-input');
      const quickActions = this.shadowRoot.querySelectorAll('.quick-action');
      const overlay = this.shadowRoot.getElementById('build-agent-overlay');

      let isOverlayVisible = false;

      toggleBtn?.addEventListener('click', () => {
        isOverlayVisible = !isOverlayVisible;
        if (overlay) {
          overlay.style.transform = isOverlayVisible ? 'translateX(0)' : 'translateX(420px)';
        }
      });

      closeBtn?.addEventListener('click', () => {
        isOverlayVisible = false;
        if (overlay) {
          overlay.style.transform = 'translateX(420px)';
        }
      });

      executeBtn?.addEventListener('click', () => {
        const command = commandInput?.value?.trim();
        if (command) {
          this.executeCommand(command);
          commandInput.value = '';
        }
      });

      commandInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const command = commandInput.value.trim();
          if (command) {
            this.executeCommand(command);
            commandInput.value = '';
          }
        }
      });

      quickActions.forEach(btn => {
        btn.addEventListener('click', () => {
          const command = btn.dataset.command;
          if (command) {
            this.executeCommand(command);
          }
        });

        btn.addEventListener('mouseenter', () => {
          btn.style.backgroundColor = '#e5e7eb';
        });

        btn.addEventListener('mouseleave', () => {
          btn.style.backgroundColor = '#f3f4f6';
        });
      });
    }

    async executeCommand(command) {
      try {
        // Import and use the DOM modification utilities
        const { DOMModifier } = await import(chrome.runtime.getURL('domModifier.js'));
        const { NLPProcessor } = await import(chrome.runtime.getURL('nlpProcessor.js'));

        const nlpProcessor = new NLPProcessor();
        const domModifier = new DOMModifier();

        // Process the natural language command
        const intent = await nlpProcessor.processCommand(command);
        
        // Execute the DOM modifications
        const modifications = await domModifier.applyModifications(intent);

        this.showNotification(`✅ Executed: ${command}`, 'success');
      } catch (error) {
        console.error('Command execution failed:', error);
        this.showNotification(`❌ Failed: ${error.message}`, 'error');
      }
    }

    async showInspector() {
      // Implement DOM inspector functionality
      this.showNotification('DOM Inspector activated', 'info');
    }

    async showHistory() {
      // Implement history functionality
      this.showNotification('Change History opened', 'info');
    }

    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed !important;
        top: 80px !important;
        right: 20px !important;
        max-width: 300px !important;
        padding: 12px 16px !important;
        border-radius: 8px !important;
        color: white !important;
        font-weight: 600 !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25) !important;
        animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #059669) !important;' : ''}
        ${type === 'error' ? 'background: linear-gradient(135deg, #ef4444, #dc2626) !important;' : ''}
        ${type === 'info' ? 'background: linear-gradient(135deg, #3b82f6, #2563eb) !important;' : ''}
      `;
      notification.textContent = message;

      // Add animation keyframes
      if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 3000);
    }

    async getStorageValue(key, defaultValue) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] ?? defaultValue);
        });
      });
    }

    async setStorageValue(key, value) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, resolve);
      });
    }
  }

  // Initialize the DOM Build Agent
  new DOMBuildAgent();
})();
