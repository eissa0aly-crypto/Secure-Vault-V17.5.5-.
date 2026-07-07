export type CollectionName = 
  | 'credentials'
  | 'ai_agents'
  | 'servers'
  | 'links'
  | 'huggingface'
  | 'free_servers'
  | 'users'
  | 'activity_log'
  | 'settings'
  | 'backups'
  | 'webhooks'
  | 'test_history'
  | 'categories'
  | 'tags'
  | 'favorites';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Credential extends BaseEntity {
  name: string;
  token: string;
  description: string;
  category: string;
  subcategory: string;
  expiryDate: string;
  isFavorite: boolean;
  isPinned: boolean;
  status: 'active' | 'expiring' | 'expired';
  tags: string[];
  lastUsed: string | null;
  usageCount: number;
  notes: string;
  customFields?: {key: string, value: string}[];
}

export interface AIAgent extends BaseEntity {
  name: string;
  provider: string;
  url: string;
  modelName: string;
  apiKey: string;
  status: 'active' | 'inactive';
  description?: string;
  isFavorite: boolean;
  customFields?: {key: string, value: string}[];
}

export interface Server extends BaseEntity {
  name: string;
  type: 'local' | 'vps' | 'cloud' | 'dedicated';
  provider: string;
  ipAddress: string;
  domain?: string;
  port: number;
  username: string;
  password?: string;
  sshKey?: string;
  status: 'online' | 'offline';
  os?: string;
  specs?: string;
  services?: string;
  customFields?: {key: string, value: string}[];
}

export interface Link extends BaseEntity {
  name: string;
  url: string;
  type: string;
  category: string;
  icon?: string;
  tags: string[];
  visits: number;
  lastVisited: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  customFields?: {key: string, value: string}[];
}

export interface HuggingFaceResource extends BaseEntity {
  name: string;
  spaceId: string;
  type: 'model' | 'space' | 'dataset';
  status: 'active' | 'inactive';
  likes: number;
  downloads: number;
  customFields?: {key: string, value: string}[];
}

export interface FreeServer extends BaseEntity {
  name: string;
  type: 'ai_ml' | 'static' | 'backend' | 'fullstack' | 'database' | 'container';
  description: string;
  signupUrl: string;
  docsUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  website: string;
  freeTierDetails: string;
  limits: {
    storage: string;
    bandwidth: string;
    requests: string;
    builds: string;
  };
  status: 'active' | 'inactive' | 'trial';
  isFavorite: boolean;
  notes: string;
  tags: string[];
  customFields?: {key: string, value: string}[];
}

export interface ActivityLog extends BaseEntity {
  action: string;
  entityType: CollectionName;
  entityId?: string;
  details: string;
}

export interface Settings {
  id: string;
  theme: 'dark' | 'light';
  language: 'ar' | 'en';
  autoBackup: boolean;
}
