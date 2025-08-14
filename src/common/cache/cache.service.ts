import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache, CachingConfig } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T = any>(key: string): Promise<T> {
    return this.cache.get(key);
  }

  async set(key: string, item: any, ttl = 0): Promise<any> {
    return await this.cache.set(key, item, ttl);
  }

  async remove(key: string): Promise<any | any[]> {
    return this.cache.del(key);
  }

  async reset(): Promise<void> {
    return this.cache.reset();
  }

  async wrap(
    key: string,
    cb: () => Promise<any>,
    config?: CachingConfig<any>,
  ): Promise<any> {
    const data = await this.cache.wrap(key, cb, config);
    if (!!data && config?.ttl && typeof config.ttl === 'number') {
      this.set(key, data, config.ttl);
    }

    return data;
  }
}
