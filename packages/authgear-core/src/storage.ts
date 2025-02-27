import { TokenStorage, _StorageDriver } from "./types";

/**
 * @internal
 */
export class _KeyMaker {
  // eslint-disable-next-line class-methods-use-this
  private scopedKey(key: string): string {
    return `authgear_${key}`;
  }

  keyRefreshToken(name: string): string {
    return `${this.scopedKey(name)}_refreshToken`;
  }

  keyOIDCCodeVerifier(name: string): string {
    return `${this.scopedKey(name)}_oidcCodeVerifier`;
  }

  keyAnonymousKeyID(name: string): string {
    return `${this.scopedKey(name)}_anonymousKeyID`;
  }

  keyBiometricKeyID(name: string): string {
    return `${this.scopedKey(name)}_biometricKeyID`;
  }
}

/**
 * @internal
 */
export class _SafeStorageDriver implements _StorageDriver {
  driver: _StorageDriver;

  constructor(driver: _StorageDriver) {
    this.driver = driver;
  }

  async del(key: string): Promise<void> {
    try {
      await this.driver.del(key);
    } catch {}
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.driver.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.driver.set(key, value);
    } catch {}
  }
}

/**
 * @internal
 */
export class _MemoryStorageDriver implements _StorageDriver {
  backingStore: { [key: string]: string | undefined };

  constructor() {
    this.backingStore = {};
  }

  async get(key: string): Promise<string | null> {
    const value = this.backingStore[key];
    if (value != null) {
      return value;
    }
    return null;
  }
  async set(key: string, value: string): Promise<void> {
    this.backingStore[key] = value;
  }
  async del(key: string): Promise<void> {
    delete this.backingStore[key];
  }
}

/**
 * @public
 */
export class TransientTokenStorage implements TokenStorage {
  private keyMaker: _KeyMaker;
  private storageDriver: _StorageDriver;

  constructor() {
    this.keyMaker = new _KeyMaker();
    this.storageDriver = new _SafeStorageDriver(new _MemoryStorageDriver());
  }

  async setRefreshToken(
    namespace: string,
    refreshToken: string
  ): Promise<void> {
    await this.storageDriver.set(
      this.keyMaker.keyRefreshToken(namespace),
      refreshToken
    );
  }

  async getRefreshToken(namespace: string): Promise<string | null> {
    return this.storageDriver.get(this.keyMaker.keyRefreshToken(namespace));
  }

  async delRefreshToken(namespace: string): Promise<void> {
    await this.storageDriver.del(this.keyMaker.keyRefreshToken(namespace));
  }
}
