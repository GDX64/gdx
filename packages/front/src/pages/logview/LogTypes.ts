import { TreeNode } from 'primevue/treenode';

export interface LogStatePlugin {
  onLog(log: LogEssentials): void;

  format(): FormatNode;
}

export type LogEssentials = {
  date: Date;
  original: string;
  level: string;
  message: string;
  index: number;
};

export type FormatNode = TreeNode;
