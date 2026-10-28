import { institutionsModule } from './institutions/index.js';
import { catalogModule } from './catalog/index.js';
import { assetsModule } from './assets/index.js';
import { qualityModule } from './quality/index.js';
import { indicatorsModule } from './indicators/index.js';
import { residentsModule } from './residents/index.js';
import { channelsModule } from './channels/index.js';
import { queryModule } from './query/index.js';
import { warehouseModule } from './warehouse/index.js';

// 模块清单：新增/移除模块只需改这一行，不影响数据库适配器与其他模块。
const allModules = [
  institutionsModule, catalogModule, assetsModule, qualityModule,
  indicatorsModule, residentsModule, channelsModule, queryModule, warehouseModule,
];

// MODULES=institutions,catalog,assets 时只挂载指定模块；留空表示全部。
const requested = (process.env.MODULES || '').split(',').map((s) => s.trim()).filter(Boolean);
export const modules = requested.length ? allModules.filter((m) => requested.includes(m.name)) : allModules;
if (requested.length) console.log(`[modules] enabled: ${modules.map((m) => m.name).join(', ')}`);
