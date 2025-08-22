
// DOM Modifier for Chrome Extension
export class DOMModifier {
  constructor() {
    this.modifications = [];
  }

  async applyModifications(intent) {
    this.modifications = [];

    try {
      switch (intent.action) {
        case 'add':
          await this.addElement(intent);
          break;
        case 'modify':
          await this.modifyElement(intent);
          break;
        case 'remove':
          await this.removeElement(intent);
          break;
        case 'style':
          await this.styleElement(intent);
          break;
        case 'hide':
          await this.hideElement(intent);
          break;
        case 'show':
          await this.showElement(intent);
          break;
        default:
          throw new Error(`Unknown action: ${intent.action}`);
      }

      this.saveToHistory(intent);
      return this.modifications;
    } catch (error) {
      console.error('DOM modification failed:', error);
      throw error;
    }
  }

  async addElement(intent) {
    const { target, content, properties, position = 'append' } = intent;
    
    const element = document.createElement(target);
    
    if (content) {
      element.textContent = content;
    }
    
    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        if (key === 'style') {
          element.style.cssText = value;
        } else if (key.startsWith('data-')) {
          element.setAttribute(key, value);
        } else if (key === 'className') {
          element.className = value;
        } else {
          element.setAttribute(key, value);
        }
      });
    }

    let targetElement = document.body;
    
    if (intent.selector) {
      targetElement = document.querySelector(intent.selector);
    }
    
    if (!targetElement) {
      targetElement = document.body;
    }

    switch (position) {
      case 'before':
        targetElement.parentNode?.insertBefore(element, targetElement);
        break;
      case 'after':
        targetElement.parentNode?.insertBefore(element, targetElement.nextSibling);
        break;
      case 'prepend':
        targetElement.insertBefore(element, targetElement.firstChild);
        break;
      case 'append':
      default:
        targetElement.appendChild(element);
        break;
    }

    this.modifications.push({
      type: 'add',
      selector: this.getSelector(element),
      element: element.outerHTML
    });
  }

  async modifyElement(intent) {
    const selector = intent.selector || intent.target;
    const elements = document.querySelectorAll(selector);

    elements.forEach(element => {
      if (intent.content !== undefined) {
        const oldValue = element.textContent || '';
        element.textContent = intent.content;
        
        this.modifications.push({
          type: 'modify',
          selector: this.getSelector(element),
          property: 'textContent',
          oldValue,
          newValue: intent.content
        });
      }

      if (intent.properties) {
        Object.entries(intent.properties).forEach(([key, value]) => {
          const oldValue = this.getPropertyValue(element, key);
          this.setPropertyValue(element, key, value);
          
          this.modifications.push({
            type: 'modify',
            selector: this.getSelector(element),
            property: key,
            oldValue,
            newValue: value
          });
        });
      }
    });
  }

  async removeElement(intent) {
    const selector = intent.selector || intent.target;
    const elements = document.querySelectorAll(selector);

    elements.forEach(element => {
      this.modifications.push({
        type: 'remove',
        selector: this.getSelector(element),
        element: element.outerHTML
      });
      
      element.remove();
    });
  }

  async styleElement(intent) {
    const selector = intent.selector || intent.target;
    const elements = document.querySelectorAll(selector);

    elements.forEach(element => {
      const htmlElement = element;
      const oldStyle = htmlElement.style.cssText;
      
      if (intent.properties) {
        Object.entries(intent.properties).forEach(([property, value]) => {
          htmlElement.style[property] = value;
        });
      }

      this.modifications.push({
        type: 'modify',
        selector: this.getSelector(element),
        property: 'style',
        oldValue: oldStyle,
        newValue: htmlElement.style.cssText
      });
    });
  }

  async hideElement(intent) {
    const selector = intent.selector || intent.target;
    const elements = document.querySelectorAll(selector);

    elements.forEach(element => {
      const oldDisplay = element.style.display;
      element.style.display = 'none';

      this.modifications.push({
        type: 'modify',
        selector: this.getSelector(element),
        property: 'display',
        oldValue: oldDisplay,
        newValue: 'none'
      });
    });
  }

  async showElement(intent) {
    const selector = intent.selector || intent.target;
    const elements = document.querySelectorAll(selector);

    elements.forEach(element => {
      const oldDisplay = element.style.display;
      element.style.display = '';

      this.modifications.push({
        type: 'modify',
        selector: this.getSelector(element),
        property: 'display',
        oldValue: oldDisplay,
        newValue: ''
      });
    });
  }

  getSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }
    
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
      const index = siblings.indexOf(element) + 1;
      return `${element.tagName.toLowerCase()}:nth-child(${index})`;
    }
    
    return element.tagName.toLowerCase();
  }

  getPropertyValue(element, property) {
    if (property === 'textContent') {
      return element.textContent || '';
    } else if (property === 'style') {
      return element.style.cssText;
    } else if (property.startsWith('data-')) {
      return element.getAttribute(property) || '';
    } else {
      return element.getAttribute(property) || '';
    }
  }

  setPropertyValue(element, property, value) {
    if (property === 'textContent') {
      element.textContent = value;
    } else if (property === 'style') {
      element.style.cssText = value;
    } else if (property.startsWith('data-')) {
      element.setAttribute(property, value);
    } else if (property === 'className') {
      element.className = value;
    } else {
      element.setAttribute(property, value);
    }
  }

  saveToHistory(intent) {
    const historyEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      command: `${intent.action} ${intent.target}${intent.content ? ': ' + intent.content : ''}`,
      modifications: this.modifications,
      status: 'success'
    };

    const existingHistory = JSON.parse(localStorage.getItem('yootheme-build-agent-history') || '[]');
    existingHistory.push(historyEntry);
    localStorage.setItem('yootheme-build-agent-history', JSON.stringify(existingHistory));
  }
}
