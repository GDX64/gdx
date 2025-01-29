import Dexie, { liveQuery, Observable } from 'dexie';

type LogFile = {
  name: string;
  content: string;
  id?: number;
};

export type ColorRule = {
  regex: string;
  color: string;
  name: string;
};

export type PluginStored = {
  name: string;
  code: string;
  saveDate: number;
};

export class LogsDatabase extends Dexie {
  private logs: Dexie.Table<LogFile, number>;
  private colorRules: Dexie.Table<ColorRule, number>;
  private plugins: Dexie.Table<PluginStored, number>;

  constructor() {
    super('LogsDatabase');
    this.version(3).stores({
      logs: '++id, &name',
      colorRules: '&name',
      plugins: '&name',
    });
    this.colorRules = this.table('colorRules');
    this.logs = this.table('logs');
    this.plugins = this.table('plugins');
  }

  loadLogFile(name: string): Promise<LogFile | undefined> {
    return this.logs.get({ name });
  }

  saveColorRule(rule: ColorRule): Promise<number> {
    return this.colorRules.put({ ...rule });
  }

  async saveRawFile(file: File) {
    const name = file.name;
    const content = await file.text();
    const existing = await this.logs.get({ name });
    if (existing) {
      return this.logs.update(existing.id!, { content });
    }
    return this.logs.put({ name, content });
  }

  savePlugin(plugin: PluginStored): Promise<number> {
    return this.plugins.put(plugin);
  }

  deletePlugin(name: string): Promise<number> {
    return this.plugins.where('name').equals(name).delete();
  }

  deleteColorRule(name: string): Promise<number> {
    return this.colorRules.where('name').equals(name).delete();
  }

  lastFile(): Promise<LogFile | undefined> {
    return this.logs.orderBy(':id').last();
  }

  loadColorRules(): Promise<ColorRule[]> {
    return this.colorRules.toArray();
  }

  loadPlugins(): Promise<PluginStored[]> {
    return this.plugins.toArray();
  }

  colorRulesObserver(): Observable<ColorRule[]> {
    return liveQuery(async () => {
      return this.colorRules.toArray();
    });
  }

  pluginsObserver(): Observable<PluginStored[]> {
    return liveQuery(async () => {
      return this.plugins.toArray();
    });
  }

  filesObserver(): Observable<string[]> {
    return liveQuery(async () => {
      const keys = await this.logs.orderBy('name').keys();
      return keys as string[];
    });
  }

  saveLogFile(name: string, content: string): Promise<number> {
    return this.logs.put({ name, content });
  }

  deleteFile(name: string): Promise<number> {
    return this.logs.where('name').equals(name).delete();
  }
}
