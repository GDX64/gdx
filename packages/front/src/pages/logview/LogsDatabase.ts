import Dexie, { liveQuery, Observable } from 'dexie';

export type LogFile = {
  name: string;
  content: string;
  id?: number;
  lastOpen: Date;
};

export type ColorRule = {
  regex: string;
  color: string;
  name: string;
};

export type LogSearchRegex = {
  regex: string;
  name: string;
};

export type PluginStored = {
  name: string;
  code: string;
  saveDate: number;
};

export type LogAnalysis = {
  id: number;
  name: string;
  searches: string[];
  selectedLogs: Set<number>;
  showOnlySelected: boolean;
  showHistogram: boolean;
  showLocalTime: boolean;
  timeOnly: boolean;
  hightLightedLogIndex: number | null;
  startDate?: Date;
  endDate?: Date;
  logFileID: number;
  updatedAt: Date;
};

export type LogComment = {
  id?: number;
  comment: string;
  updatedAt: Date;
  analysisID: number;
  logIndex: number;
};

export class LogsDatabase extends Dexie {
  private logs: Dexie.Table<LogFile, number>;
  private colorRules: Dexie.Table<ColorRule, number>;
  private plugins: Dexie.Table<PluginStored, number>;
  private searches: Dexie.Table<LogSearchRegex, number>;
  private logAnalysis: Dexie.Table<LogAnalysis, number>;
  private comments: Dexie.Table<LogComment, number>;

  constructor() {
    super('LogsDatabase');
    this.version(4)
      .stores({
        logs: '++id, &name, lastOpen',
        colorRules: '&name',
        plugins: '&name',
        searches: '&name',
        logAnalysis: '++id, &name, updatedAt',
        comments: '++id, updatedAt, analysisID',
      })
      .upgrade(async () => {
        await this.logs.clear();
      });
    this.colorRules = this.table('colorRules');
    this.logs = this.table('logs');
    this.plugins = this.table('plugins');
    this.searches = this.table('searches');
    this.logAnalysis = this.table('logAnalysis');
    this.comments = this.table('comments');
  }

  loadLogFile(name: string): Promise<LogFile | undefined> {
    return this.logs.get({ name });
  }

  getLogFile(id: number): Promise<LogFile | undefined> {
    return this.logs.get(id);
  }

  saveColorRule(rule: ColorRule): Promise<number> {
    return this.colorRules.put({ ...rule });
  }

  async saveRawFile(file: File) {
    const name = file.name;
    const content = await file.text();
    const existing = await this.logs.get({ name });
    if (existing) {
      await this.logs.update(existing.id!, { content });
      return existing.id!;
    }
    return this.logs.put({ name, content, lastOpen: new Date() });
  }

  savePlugin(plugin: PluginStored): Promise<number> {
    return this.plugins.put(plugin);
  }

  saveSearch(search: LogSearchRegex): Promise<number> {
    return this.searches.put(search);
  }

  deletePlugin(name: string): Promise<number> {
    return this.plugins.where('name').equals(name).delete();
  }

  deleteSearch(name: string): Promise<number> {
    return this.searches.where('name').equals(name).delete();
  }

  deleteColorRule(name: string): Promise<number> {
    return this.colorRules.where('name').equals(name).delete();
  }

  deleteLogAnalysis(id: number): Promise<number> {
    return this.logAnalysis.where('id').equals(id).delete();
  }

  lastFile(): Promise<LogFile | undefined> {
    return this.logs.orderBy('lastOpen').last();
  }

  loadColorRules(): Promise<ColorRule[]> {
    return this.colorRules.toArray();
  }

  loadSearches(): Promise<LogSearchRegex[]> {
    return this.searches.toArray();
  }

  loadPlugins(): Promise<PluginStored[]> {
    return this.plugins.toArray();
  }

  loadAnalysisNames() {
    return this.logAnalysis.toCollection().keys();
  }

  getLastLogAnalysis() {
    return this.logAnalysis.orderBy('updatedAt').last();
  }

  putAnalysis(analysis: LogAnalysis): Promise<number> {
    return this.logAnalysis.put(analysis);
  }

  analysisObserver(): Observable<{ name: string; id: number }[]> {
    return liveQuery(async () => {
      const arr = await this.logAnalysis.orderBy('name').toArray();
      return arr.map((a) => ({ name: a.name, id: a.id }));
    });
  }

  getAnalysis(id: number): Promise<LogAnalysis | undefined> {
    return this.logAnalysis.get(id);
  }

  addLogAnalysis(analysis: Omit<LogAnalysis, 'id'>): Promise<number> {
    return this.logAnalysis.add(analysis as LogAnalysis);
  }

  colorRulesObserver(): Observable<ColorRule[]> {
    return liveQuery(async () => {
      return this.colorRules.toArray();
    });
  }

  searchObservable(): Observable<LogSearchRegex[]> {
    return liveQuery(async () => {
      return this.searches.toArray();
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
    return this.logs.put({ name, content, lastOpen: new Date() });
  }

  updateFileLastOpen(name: string): Promise<number> {
    return this.logs.where('name').equals(name).modify({ lastOpen: new Date() });
  }

  deleteFile(name: string): Promise<number> {
    return this.logs.where('name').equals(name).delete();
  }

  saveComment(comment: LogComment): Promise<number> {
    return this.comments.put(comment);
  }

  commentsObserver(analysisID: number): Observable<LogComment[]> {
    return liveQuery(async () => {
      return this.comments.where('analysisID').equals(analysisID).toArray();
    });
  }

  deleteComment(id: number): Promise<number> {
    return this.comments.where('id').equals(id).delete();
  }
}
