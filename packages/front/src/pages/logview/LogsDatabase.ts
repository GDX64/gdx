import Dexie, { liveQuery, Observable } from 'dexie';

type LogFile = {
  name: string;
  content: string;
};

export class LogsDatabase extends Dexie {
  private logs: Dexie.Table<LogFile, number>;

  constructor() {
    super('LogsDatabase');
    this.version(1).stores({
      logs: '++id, &name',
    });
    this.logs = this.table('logs');
  }

  loadLogFile(name: string): Promise<string | null> {
    return this.logs.get({ name }).then((log) => log?.content ?? null);
  }

  lastFile(): Promise<LogFile | undefined> {
    return this.logs.orderBy(':id').last();
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
