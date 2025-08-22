
// Popup script for Chrome extension
class ExtensionPopup {
  constructor() {
    this.isActive = false;
    this.currentTab = null;
    this.init();
  }

  async init() {
    await this.getCurrentTab();
    await this.checkStatus();
    this.bindEvents();
  }

  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tab;
    
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo && tab) {
      pageInfo.textContent = `Active on: ${new URL(tab.url).hostname}`;
    }
  }

  async checkStatus() {
    if (!this.currentTab) return;

    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'checkStatus'
      });

      this.isActive = response?.isActive || false;
      this.updateStatus();
    } catch (error) {
      console.log('Content script not loaded yet');
      this.isActive = false;
      this.updateStatus();
    }
  }

  updateStatus() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const toggleBtn = document.getElementById('toggleAgent');

    if (this.isActive) {
      statusDot.classList.remove('inactive');
      statusText.textContent = 'Build Agent Active';
      toggleBtn.textContent = 'Deactivate Build Agent';
    } else {
      statusDot.classList.add('inactive');
      statusText.textContent = 'Build Agent Inactive';
      toggleBtn.textContent = 'Activate Build Agent';
    }
  }

  bindEvents() {
    const toggleBtn = document.getElementById('toggleAgent');
    const inspectorBtn = document.getElementById('openInspector');
    const historyBtn = document.getElementById('showHistory');
    const commandBtns = document.querySelectorAll('.command-btn');

    toggleBtn.addEventListener('click', () => this.toggleBuildAgent());
    inspectorBtn.addEventListener('click', () => this.openInspector());
    historyBtn.addEventListener('click', () => this.showHistory());

    commandBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const command = btn.dataset.command;
        this.executeQuickCommand(command);
      });
    });
  }

  async toggleBuildAgent() {
    if (!this.currentTab) return;

    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'toggleAgent'
      });

      this.isActive = response?.isActive || false;
      this.updateStatus();

      if (this.isActive) {
        this.showNotification('Build Agent activated! You can now modify this page.');
      }
    } catch (error) {
      console.error('Failed to toggle build agent:', error);
    }
  }

  async openInspector() {
    if (!this.currentTab) return;

    try {
      await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'showInspector'
      });
      window.close();
    } catch (error) {
      console.error('Failed to open inspector:', error);
    }
  }

  async showHistory() {
    if (!this.currentTab) return;

    try {
      await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'showHistory'
      });
      window.close();
    } catch (error) {
      console.error('Failed to show history:', error);
    }
  }

  async executeQuickCommand(command) {
    if (!this.currentTab) return;

    try {
      await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'executeCommand',
        command: command
      });

      this.showNotification(`Executing: ${command}`);
      window.close();
    } catch (error) {
      console.error('Failed to execute command:', error);
    }
  }

  showNotification(message) {
    // Create a simple notification in the popup
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      background: rgba(16, 185, 129, 0.9);
      color: white;
      padding: 10px;
      border-radius: 6px;
      font-size: 0.8em;
      z-index: 1000;
      animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 2000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ExtensionPopup();
});
