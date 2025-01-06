import { LogEssentials, LogStatePlugin } from './LogTypes';

export class ConnectionStatePlugin implements LogStatePlugin {
  private serverStatus = new Map<string, boolean>();

  onLog(log: LogEssentials): void {
    const isReset = log.level === 'ProductOpen';
    if (isReset) {
      this.serverStatus.clear();
      return;
    }
    const isSocketMain = log.message.includes('SocketMainConnection');
    if (!isSocketMain) return;
    const isConnected = log.message.includes('Logged');
    const isNotConnected = log.message.includes('lost');
    if (isConnected || isNotConnected) {
      const serverKind = log.message.split('|')[1];
      this.serverStatus.set(serverKind, isConnected);
    }
  }

  format(): string {
    return [...this.serverStatus.entries()]
      .map(([server, connected]) => {
        return `${server} ${connected ? 'logged' : 'not logged'}`;
      })
      .join('\n\r');
  }
}
