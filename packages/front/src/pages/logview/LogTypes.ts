export interface LogStatePlugin {
  onLog(log: LogEssentials): void;

  format(): string;
}

export type LogEssentials = {
  date: Date;
  original: string;
  level: string;
  message: string;
  index: number;
};
