import { FormatNode, LogEssentials, LogStatePlugin } from './LogTypes';

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

  format(): FormatNode {
    const nodes = [...this.serverStatus.entries()].map(
      ([server, connected]): FormatNode => {
        return {
          key: `connection, ${server}`,
          label: `${server} ${connected ? 'Connected' : 'Disconnected'}`,
        };
      }
    );
    return {
      key: 'connection',
      label: 'Connection',
      children: nodes,
    };
  }
}
