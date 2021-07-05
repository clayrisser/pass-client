/*
 * File: /src/pass.ts
 * Project: pass-client
 * File Created: 05-07-2021 14:25:01
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 05-07-2021 15:49:21
 * Modified By: Clay Risser <email@clayrisser.com>
 * -----
 * Silicon Hills LLC (c) Copyright 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import execa from 'execa';
import os from 'os';
import path from 'path';
import which from 'which';
import NativeMessage from '~/nativeMessage';
import { Action, HashMap, Response } from '~/types';

export default class Pass {
  private options: PassOptions;

  constructor(options: PassOptions = {}) {
    this.options = {
      browserpass: true,
      ...options
    };
  }

  private _browserpass: NativeMessage | null = null;

  private _browserpassPath = '';

  private _gpgPath = '';

  private _passPath = '';

  private _findPath = '';

  private _opensslPath = '';

  async list(): Promise<ListData> {
    const browserpass = await this.getBrowserpass();
    if (browserpass) {
      return (
        await browserpass.request<Response<ListData>>({
          action: Action.list,
          echoResponse: '',
          file: '',
          storeId: 'default',
          settings: {
            gpgPath: await this.getGpgPath(),
            stores: {
              default: {
                id: 'default',
                name: 'default',
                path: this.passwordStorePath,
                settings: {
                  gpgPath: await this.getGpgPath()
                }
              }
            }
          }
        })
      ).data;
    }
    const files = (
      await execa(
        await this.getFindPath(),
        ['.', '-type', 'f', '-name', '*.gpg'],
        {
          cwd: this.passwordStorePath
        }
      )
    ).stdout
      .split('\n')
      .map((file: string) => file.substr(2));
    return { files: { default: files } };
  }

  async show(file: string): Promise<FetchData> {
    if (!/.gpg$/.test(file)) file = `${file}.gpg`;
    const browserpass = await this.getBrowserpass();
    if (browserpass) {
      return (
        await browserpass.request<Response<FetchData>>({
          action: Action.fetch,
          echoResponse: '',
          file,
          storeId: 'default',
          settings: {
            gpgPath: await this.getGpgPath(),
            stores: {
              default: {
                id: 'default',
                name: 'default',
                path: this.passwordStorePath,
                settings: {
                  gpgPath: await this.getGpgPath()
                }
              }
            }
          }
        })
      ).data;
    }
    const contents = (
      await execa(await this.getPassPath(), [
        'show',
        file.replace(/.gpg$/g, '')
      ])
    ).stdout;
    return { contents };
  }

  async insert(file: string, content: string): Promise<void> {
    await execa(
      `(echo "${Buffer.from(content).toString(
        'base64'
      )}") | ${await this.getOpensslPath()} base64 -d | pass insert -m ${file.replace(
        /.gpg$/g,
        ''
      )}`,
      { shell: true }
    );
  }

  private async getGpgPath(): Promise<string> {
    if (this._gpgPath.length) {
      return this._gpgPath;
    }
    this._gpgPath = this.options.gpgPath || (await which('gpg')) || 'gpg';
    return this._gpgPath;
  }

  private async getPassPath(): Promise<string> {
    if (this._passPath.length) {
      return this._passPath;
    }
    this._passPath = this.options.passPath || (await which('pass')) || 'pass';
    return this._passPath;
  }

  private async getFindPath(): Promise<string> {
    if (this._findPath.length) {
      return this._findPath;
    }
    this._findPath = this.options.findPath || (await which('find')) || 'find';
    return this._findPath;
  }

  private async getOpensslPath(): Promise<string> {
    if (this._opensslPath.length) {
      return this._opensslPath;
    }
    this._opensslPath =
      this.options.opensslPath || (await which('openssl')) || 'openssl';
    return this._opensslPath;
  }

  private async getBrowserpassPath(): Promise<string | null> {
    if (this._browserpassPath.length) {
      return this._browserpassPath;
    }
    const browserpassPath =
      this.options.browserpassPath || (await which('browserpass'));
    if (!browserpassPath) return null;
    this._browserpassPath = browserpassPath;
    return this._browserpassPath;
  }

  private async getBrowserpass(): Promise<NativeMessage | null> {
    if (!this.options.browserpass) return null;
    if (this._browserpass) return this._browserpass;
    const browserpassPath = await this.getBrowserpassPath();
    if (!browserpassPath) return null;
    this._browserpass = new NativeMessage(browserpassPath);
    return this._browserpass;
  }

  private get passwordStorePath() {
    return this.options.passwordStorePath
      ? path.resolve(this.options.passwordStorePath)
      : path.resolve(os.homedir(), '.password-store');
  }
}

export interface ListData {
  files: HashMap<string[]>;
}

export interface FetchData {
  contents: string;
}

export interface PassOptions {
  browserpass?: boolean;
  browserpassPath?: string;
  opensslPath?: string;
  findPath?: string;
  gpgPath?: string;
  passPath?: string;
  passwordStorePath?: string;
}
