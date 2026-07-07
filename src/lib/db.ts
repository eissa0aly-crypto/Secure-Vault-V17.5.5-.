import { CollectionName } from '../types';
import { defaultFreeServers, defaultAIAgents, defaultServers, defaultLinks, defaultHuggingFace } from './defaultData';
import { encryptText, decryptText } from './crypto';

const PREFIX = 'vault_v17_5_5_';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getTimestamp(): string {
  return new Date().toISOString();
}

export async function initDatabase() {
  console.log("Initializing database...");
  if (!localStorage.getItem(`${PREFIX}settings`)) {
    localStorage.setItem(`${PREFIX}settings`, JSON.stringify([{ id: '1', theme: 'dark', language: 'ar', autoBackup: true }]));
  }
  
  if (!localStorage.getItem(`${PREFIX}free_servers`) || JSON.parse(localStorage.getItem(`${PREFIX}free_servers`) || '[]').length === 0) {
    const populated = defaultFreeServers.map(s => ({
      ...s,
      id: generateId(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    }));
    localStorage.setItem(`${PREFIX}free_servers`, JSON.stringify(populated));
  }
  
  if (!localStorage.getItem(`${PREFIX}ai_agents`) || JSON.parse(localStorage.getItem(`${PREFIX}ai_agents`) || '[]').length === 0) {
    const populated = defaultAIAgents.map(s => ({
      ...s,
      id: generateId(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    }));
    localStorage.setItem(`${PREFIX}ai_agents`, JSON.stringify(populated));
  }

  if (!localStorage.getItem(`${PREFIX}servers`) || JSON.parse(localStorage.getItem(`${PREFIX}servers`) || '[]').length === 0) {
    const populated = defaultServers.map(s => ({
      ...s,
      id: generateId(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    }));
    localStorage.setItem(`${PREFIX}servers`, JSON.stringify(populated));
  }

  if (!localStorage.getItem(`${PREFIX}links`) || JSON.parse(localStorage.getItem(`${PREFIX}links`) || '[]').length === 0) {
    const populated = defaultLinks.map(s => ({
      ...s,
      id: generateId(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    }));
    localStorage.setItem(`${PREFIX}links`, JSON.stringify(populated));
  }

  if (!localStorage.getItem(`${PREFIX}huggingface`) || JSON.parse(localStorage.getItem(`${PREFIX}huggingface`) || '[]').length === 0) {
    const populated = defaultHuggingFace.map(s => ({
      ...s,
      id: generateId(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    }));
    localStorage.setItem(`${PREFIX}huggingface`, JSON.stringify(populated));
  }
  
  const collections: CollectionName[] = [
    'credentials', 'users', 'activity_log', 'backups', 'webhooks', 
    'test_history', 'categories', 'tags', 'favorites'
  ];
  
  collections.forEach(col => {
    if (!localStorage.getItem(`${PREFIX}${col}`)) {
      localStorage.setItem(`${PREFIX}${col}`, JSON.stringify([]));
    }
  });
}

export function getCollection<T>(collection: CollectionName): T[] {
  const data = localStorage.getItem(`${PREFIX}${collection}`);
  return data ? JSON.parse(data) : [];
}

export function getItem<T>(collection: CollectionName, id: string): T | undefined {
  const items = getCollection<any>(collection);
  return items.find(item => item.id === id);
}

export async function addItem<T>(collection: CollectionName, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
  const items = getCollection<any>(collection);
  
  let processedData = { ...data } as any;
  // Encrypt sensitive fields before saving
  if (collection === 'credentials' && processedData.token) {
    processedData.token = await encryptText(processedData.token);
  }
  
  const newItem = {
    ...processedData,
    id: generateId(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp()
  };
  
  items.push(newItem);
  localStorage.setItem(`${PREFIX}${collection}`, JSON.stringify(items));
  
  // Log activity
  logActivity('added', collection, newItem.id, `Added item to ${collection}`);
  
  return newItem;
}

export async function updateItem<T>(collection: CollectionName, id: string, data: Partial<T>): Promise<T | null> {
  const items = getCollection<any>(collection);
  const index = items.findIndex(item => item.id === id);
  
  if (index === -1) return null;
  
  let processedData = { ...data } as any;
  if (collection === 'credentials' && processedData.token && !processedData.token.startsWith('AES-')) {
    // Basic check to see if it's already encrypted; real app might be smarter
    processedData.token = await encryptText(processedData.token);
  }
  
  items[index] = {
    ...items[index],
    ...processedData,
    updatedAt: getTimestamp()
  };
  
  localStorage.setItem(`${PREFIX}${collection}`, JSON.stringify(items));
  logActivity('edited', collection, id, `Updated item in ${collection}`);
  return items[index];
}

export function deleteItem(collection: CollectionName, id: string): boolean {
  const items = getCollection<any>(collection);
  const initialLength = items.length;
  const newItems = items.filter(item => item.id !== id);
  
  if (initialLength !== newItems.length) {
    localStorage.setItem(`${PREFIX}${collection}`, JSON.stringify(newItems));
    logActivity('deleted', collection, id, `Deleted item from ${collection}`);
    return true;
  }
  return false;
}

export function logActivity(action: string, entityType: CollectionName, entityId: string, details: string) {
  const logs = localStorage.getItem(`${PREFIX}activity_log`);
  const parsedLogs = logs ? JSON.parse(logs) : [];
  
  parsedLogs.unshift({
    id: generateId(),
    action,
    entityType,
    entityId,
    details,
    createdAt: getTimestamp(),
    updatedAt: getTimestamp()
  });
  
  // Keep only last 1000 logs
  if (parsedLogs.length > 1000) parsedLogs.length = 1000;
  
  localStorage.setItem(`${PREFIX}activity_log`, JSON.stringify(parsedLogs));
}

// Stats functions
export function getCollectionStats() {
  return {
    credentials: getCollection('credentials').length,
    aiAgents: getCollection('ai_agents').length,
    servers: getCollection('servers').length,
    links: getCollection('links').length,
    freeServers: getCollection('free_servers').length,
    huggingFace: getCollection('huggingface').length,
  };
}

export function createBackup() {
  const exportData: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      exportData[key] = localStorage.getItem(key);
    }
  }
  
  const backup = {
    id: generateId(),
    timestamp: getTimestamp(),
    data: exportData
  };
  
  const backups = getCollection<any>('backups');
  backups.push(backup);
  // keep last 10
  if(backups.length > 10) backups.shift();
  
  localStorage.setItem(`${PREFIX}backups`, JSON.stringify(backups));
  return backup;
}
