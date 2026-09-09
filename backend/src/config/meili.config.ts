import { registerAs } from '@nestjs/config';

export default registerAs('meili', () => ({
  host: process.env.MEILI_HOST ?? 'http://localhost:7700',
  masterKey: process.env.MEILI_MASTER_KEY ?? 'meili_master_key',
}));
