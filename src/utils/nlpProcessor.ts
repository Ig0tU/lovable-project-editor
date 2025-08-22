
import { Intent } from './domModifier';

export class NLPProcessor {
  private patterns = {
    add: [
      /add (?:a )?(.+?) (?:to|at|in) (.+)/i,
      /create (?:a )?(.+?) (?:in|at) (.+)/i,
      /insert (?:a )?(.+?) (?:into|in) (.+)/i,
      /add (?:a )?(.+?) saying ["'](.+)["']/i,
      /add (?:a )?(.+?) with text ["'](.+)["']/i
    ],
    modify: [
      /change (.+?) to (.+)/i,
      /modify (.+?) to (.+)/i,
      /update (.+?) to (.+)/i,
      /set (.+?) to (.+)/i
    ],
    remove: [
      /remove (.+)/i,
      /delete (.+)/i,
      /get rid of (.+)/i
    ],
    hide: [
      /hide (.+)/i,
      /make (.+?) invisible/i,
      /conceal (.+)/i
    ],
    show: [
      /show (.+)/i,
      /display (.+)/i,
      /make (.+?) visible/i,
      /reveal (.+)/i
    ],
    style: [
      /make (.+?) (.+?) colored?/i,
      /change (.+?) color to (.+)/i,
      /style (.+?) with (.+)/i,
      /make (.+?) bigger/i,
      /make (.+?) smaller/i,
      /change (.+?) background to (.+)/i
    ]
  };

  private colorMap: Record<string, string> = {
    'red': '#ef4444',
    'blue': '#3b82f6',
    'green': '#10b981',
    'yellow': '#f59e0b',
    'purple': '#8b5cf6',
    'orange': '#f97316',
    'pink': '#ec4899',
    'gray': '#6b7280',
    'black': '#000000',
    'white': '#ffffff'
  };

  async processCommand(command: string): Promise<Intent> {
    const normalizedCommand = command.toLowerCase().trim();
    
    // Try to match patterns
    for (const [action, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        const match = normalizedCommand.match(pattern);
        if (match) {
          return this.buildIntent(action as keyof typeof this.patterns, match, command);
        }
      }
    }

    // Fallback: try to parse simple commands
    return this.parseSimpleCommand(normalizedCommand);
  }

  private buildIntent(action: keyof typeof this.patterns, match: RegExpMatchArray, originalCommand: string): Intent {
    const intent: Intent = { action: action as Intent['action'], target: '' };

    switch (action) {
      case 'add':
        if (match[3]) { // "add X saying Y" pattern
          intent.target = this.parseElement(match[1]);
          intent.content = match[2];
          intent.selector = this.parseSelector(match[3] || 'body');
        } else if (match[2] && match[1]) {
          intent.target = this.parseElement(match[1]);
          intent.selector = this.parseSelector(match[2]);
          if (originalCommand.includes('saying') || originalCommand.includes('with text')) {
            const textMatch = originalCommand.match(/(?:saying|with text) ["'](.+)["']/i);
            if (textMatch) intent.content = textMatch[1];
          }
        }
        intent.properties = this.parseProperties(originalCommand);
        break;

      case 'modify':
        intent.selector = this.parseSelector(match[1]);
        intent.content = match[2];
        break;

      case 'remove':
      case 'hide':
      case 'show':
        intent.selector = this.parseSelector(match[1]);
        break;

      case 'style':
        intent.selector = this.parseSelector(match[1]);
        intent.properties = this.parseStyleProperties(match[2] || '', originalCommand);
        break;
    }

    return intent;
  }

  private parseSimpleCommand(command: string): Intent {
    // Basic fallbacks
    if (command.includes('banner') && command.includes('top')) {
      return {
        action: 'add',
        target: 'div',
        content: this.extractQuotedText(command) || 'Banner Message',
        properties: {
          style: 'position: fixed; top: 0; left: 0; right: 0; background: #3b82f6; color: white; text-align: center; padding: 12px; z-index: 9999; font-weight: bold;'
        },
        selector: 'body',
        position: 'prepend'
      };
    }

    if (command.includes('floating') && command.includes('button')) {
      return {
        action: 'add',
        target: 'button',
        content: this.extractQuotedText(command) || 'Contact Us',
        properties: {
          style: 'position: fixed; bottom: 20px; right: 20px; background: #10b981; color: white; border: none; border-radius: 50px; padding: 15px 20px; font-weight: bold; cursor: pointer; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15);'
        },
        selector: 'body'
      };
    }

    if (command.includes('hide') && command.includes('ad')) {
      return {
        action: 'hide',
        target: '',
        selector: '[class*="ad"], [id*="ad"], .advertisement, .ads'
      };
    }

    // Default fallback
    throw new Error(`Could not understand command: "${command}". Try being more specific about what you want to add, modify, or remove.`);
  }

  private parseElement(elementStr: string): string {
    const elementMap: Record<string, string> = {
      'banner': 'div',
      'button': 'button',
      'link': 'a',
      'image': 'img',
      'text': 'span',
      'paragraph': 'p',
      'heading': 'h2',
      'title': 'h1',
      'container': 'div',
      'box': 'div',
      'section': 'section'
    };

    for (const [key, value] of Object.entries(elementMap)) {
      if (elementStr.includes(key)) {
        return value;
      }
    }

    return 'div'; // default
  }

  private parseSelector(selectorStr: string): string {
    // Common selector mappings
    const selectorMap: Record<string, string> = {
      'top': 'body',
      'header': 'header, .header, #header',
      'footer': 'footer, .footer, #footer',
      'sidebar': 'aside, .sidebar, #sidebar',
      'navigation': 'nav, .nav, #nav',
      'menu': '.menu, #menu, nav',
      'content': 'main, .content, #content',
      'page': 'body',
      'buttons': 'button',
      'links': 'a',
      'images': 'img',
      'advertisements': '[class*="ad"], [id*="ad"], .advertisement, .ads',
      'ads': '[class*="ad"], [id*="ad"], .advertisement, .ads'
    };

    for (const [key, value] of Object.entries(selectorMap)) {
      if (selectorStr.includes(key)) {
        return value;
      }
    }

    // Try to detect if it's already a selector
    if (selectorStr.startsWith('.') || selectorStr.startsWith('#') || selectorStr.includes('[')) {
      return selectorStr;
    }

    return 'body'; // default
  }

  private parseProperties(command: string): Record<string, string> {
    const properties: Record<string, string> = {};

    // Extract colors
    for (const [color, hex] of Object.entries(this.colorMap)) {
      if (command.includes(color)) {
        if (command.includes('background')) {
          properties.style = (properties.style || '') + `background-color: ${hex}; `;
        } else {
          properties.style = (properties.style || '') + `color: ${hex}; `;
        }
      }
    }

    // Extract positioning
    if (command.includes('top')) {
      properties.style = (properties.style || '') + 'position: fixed; top: 0; left: 0; right: 0; z-index: 9999; ';
    }
    if (command.includes('bottom')) {
      properties.style = (properties.style || '') + 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; ';
    }
    if (command.includes('center')) {
      properties.style = (properties.style || '') + 'text-align: center; ';
    }

    // Extract styling
    if (command.includes('bold')) {
      properties.style = (properties.style || '') + 'font-weight: bold; ';
    }
    if (command.includes('rounded')) {
      properties.style = (properties.style || '') + 'border-radius: 8px; ';
    }

    return properties;
  }

  private parseStyleProperties(styleStr: string, fullCommand: string): Record<string, string> {
    const properties: Record<string, string> = {};
    
    // Color handling
    for (const [color, hex] of Object.entries(this.colorMap)) {
      if (styleStr.includes(color) || fullCommand.includes(color)) {
        if (fullCommand.includes('background')) {
          properties.backgroundColor = hex;
        } else {
          properties.color = hex;
        }
      }
    }

    // Size handling
    if (styleStr.includes('bigger') || fullCommand.includes('bigger')) {
      properties.fontSize = '1.2em';
      properties.padding = '10px';
    }
    if (styleStr.includes('smaller') || fullCommand.includes('smaller')) {
      properties.fontSize = '0.8em';
      properties.padding = '5px';
    }

    return properties;
  }

  private extractQuotedText(command: string): string | null {
    const match = command.match(/["'](.+?)["']/);
    return match ? match[1] : null;
  }
}
