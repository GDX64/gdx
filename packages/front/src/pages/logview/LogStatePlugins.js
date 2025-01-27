export default class ConnectionStatePlugin {
  serverStatus = new Map();

  /**
	 * @param {{ date: Date;
  	original: string;
  	level: string;
  	message: string;
  	index: number;
  	color: string | null}} log
	 */
  onLog(log) {
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

  /**
   *
   * @returns {{icon?: string; key: string; label: string; children: {key: string; label: string; icon?: string}[]}}
   */
  format() {
    const nodes = [...this.serverStatus.entries()].map(([server, connected]) => {
      return {
        key: `connection_${server}`,
        label: `${server}`,
        //those are primevue icons
        icon: connected ? 'pi pi-check pi-fw' : 'pi pi-times pi-fw',
      };
    });
    return {
      key: 'connection',
      label: 'Connection',
      children: nodes,
    };
  }
}
