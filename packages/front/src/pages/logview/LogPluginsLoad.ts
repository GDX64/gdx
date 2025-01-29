import { Observable, switchMap } from 'rxjs';
import { LogsDatabase, PluginStored } from './LogsDatabase';
import { PluginConstructor } from './LogTypes';
import { loadMod } from './EditorSetup';

export function loadLogPlugins(): Observable<PluginConstructor[]> {
  const db = new LogsDatabase();
  const obs$ = new Observable<PluginStored[]>((sub) => {
    return db.pluginsObserver().subscribe(sub);
  });

  return obs$.pipe(
    switchMap(async (plugins) => {
      const all = plugins.map(async (plugins) => {
        try {
          const mod = await loadMod(plugins.code);
          const PluginConstructor: PluginConstructor = mod.default;
          return PluginConstructor;
        } catch (e) {
          console.error(e);
          return null;
        }
      });
      const settled = await Promise.all(all);
      return settled.filter((result) => {
        return result !== null;
      });
    })
  );
}
