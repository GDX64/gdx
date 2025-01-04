import Dexie from 'dexie';

type LogFile = {
  name: string;
  content: string;
};

export class LogsDatabase extends Dexie {
  private logs: Dexie.Table<LogFile, number>;

  constructor() {
    super('LogsDatabase');
    this.version(1).stores({
      logs: '++id, name',
    });
    this.logs = this.table('logs');
  }

  loadLogFile(name: string): Promise<string | null> {
    return this.logs.get({ name }).then((log) => log?.content ?? null);
  }

  firstLog(): Promise<LogFile | undefined> {
    return this.logs.orderBy(':id').first();
  }

  saveLogFile(name: string, content: string): Promise<number> {
    return this.logs.put({ name, content });
  }
}
