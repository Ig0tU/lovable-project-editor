
export interface Intent {
  action: 'add' | 'modify' | 'remove' | 'style' | 'hide' | 'show';
  target: string;
  properties?: Record<string, string>;
  content?: string;
  selector?: string;
  position?: 'before' | 'after' | 'prepend' | 'append';
}

export interface Modification {
  type: 'add' | 'modify' | 'remove';
  selector: string;
  property?: string;
  oldValue?: string;
  newValue?: string;
  element?: string;
}

export class DOMModifier {
  private modifications: Modification[] = [];

  async applyModifications(intent: Intent): Promise<Modification[]> {
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

      // Save to history
      this.saveToHistory(intent);

      return this.modifications;
    } catch (error) {
      console.error('DOM modification failed:', error);
      throw error;
    }
  }

  private async addElement(intent: Intent) {
    const { target, content, properties, position = 'append' } = intent;
    
    // Create element
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

    // Determine where to place the element
    let targetElement: Element | null = document.body;
    
    if (intent.selector) {
      targetElement = document.querySelector(intent.selector);
    }
    
    if (!targetElement) {
      targetElement = document.body;
    }

    // Insert element
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

  private async modifyElement(intent: Intent) {
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

  private async removeElement(intent: Intent) {
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

  private async styleElement(intent: Intent) {
    const selector = intent.selector || intent.target;
    const elements = document.querySelectorAll(selector);

    elements.forEach(element => {
      const htmlElement = element as HTMLElement;
      const oldStyle = htmlElement.style.cssText;
      
      if (intent.properties) {
        Object.entries(intent.properties).forEach(([property, value]) => {
          (htmlElement.style as Record<string, string>)[property] = value;
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

  private async hideElement(intent: Intent) {
    const selector = intent.selector || intent.target;
    const elements = document.querySelectorAll(selector);

    elements.forEach(element => {
      const htmlElement = element as HTMLElement;
      const oldDisplay = htmlElement.style.display;
      htmlElement.style.display = 'none';

      this.modifications.push({
        type: 'modify',
        selector: this.getSelector(element),
        property: 'display',
        oldValue: oldDisplay,
        newValue: 'none'
      });
    });
  }

  private async showElement(intent: Intent) {
    const selector = intent.selector || intent.target;
    const elements = document.querySelectorAll(selector);

    elements.forEach(element => {
      const htmlElement = element as HTMLElement;
      const oldDisplay = htmlElement.style.display;
      htmlElement.style.display = '';

      this.modifications.push({
        type: 'modify',
        selector: this.getSelector(element),
        property: 'display',
        oldValue: oldDisplay,
        newValue: ''
      });
    });
  }

  private getSelector(element: Element): string {
    // Try to get a good selector for the element
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }
    
    // Fallback to tag name with nth-child
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
      const index = siblings.indexOf(element) + 1;
      return `${element.tagName.toLowerCase()}:nth-child(${index})`;
    }
    
    return element.tagName.toLowerCase();
  }

  private getPropertyValue(element: Element, property: string): string {
    if (property === 'textContent') {
      return element.textContent || '';
    } else if (property === 'style') {
      return (element as HTMLElement).style.cssText;
    } else if (property.startsWith('data-')) {
      return element.getAttribute(property) || '';
    } else {
      return element.getAttribute(property) || '';
    }
  }

  private setPropertyValue(element: Element, property: string, value: string) {
    if (property === 'textContent') {
      element.textContent = value;
    } else if (property === 'style') {
      (element as HTMLElement).style.cssText = value;
    } else if (property.startsWith('data-')) {
      element.setAttribute(property, value);
    } else if (property === 'className') {
      element.className = value;
    } else {
      element.setAttribute(property, value);
    }
  }

  private saveToHistory(intent: Intent) {
    const historyEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      command: `${intent.action} ${intent.target}${intent.content ? ': ' + intent.content : ''}`,
      modifications: this.modifications,
      status: 'success' as const
    };

    const existingHistory = JSON.parse(localStorage.getItem('dom-build-agent-history') || '[]');
    existingHistory.push(historyEntry);
    localStorage.setItem('dom-build-agent-history', JSON.stringify(existingHistory));
  }
}
