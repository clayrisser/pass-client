/*
 * File: /src/nativeMessage.ts
 * Project: pass-client
 * File Created: 05-07-2021 14:20:58
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 05-07-2021 15:55:18
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
import { Request } from '~/types';

export default class NativeMessage {
  constructor(private binary: string) {}

  async request<R = any>(request: Request): Promise<R> {
    const buffer = this.contentToBytes(JSON.stringify(request));
    let result: any = {};
    try {
      result = JSON.parse(
        Buffer.from(
          (
            await execa(this.binary, [], {
              input: buffer
            })
          ).stdout
        )
          .subarray(4)
          .toString()
      );
    } catch (err) {
      if (
        !/Unexpected\stoken\s.\sin\sJSON\sat\sposition\s\d/.test(err.message)
      ) {
        throw err;
      }
      result = JSON.parse(
        Buffer.from(
          (
            await execa(this.binary, [], {
              input: buffer
            })
          ).stdout
        )
          .subarray(6)
          .toString()
      );
    }
    return result;
  }

  private contentToBytes(content: string): Buffer {
    return Buffer.concat([
      this.lengthToBytes(content.length),
      Buffer.from(content)
    ]);
  }

  private lengthToBytes(length: number) {
    const buffer = Buffer.alloc(4);
    let hex = '';
    Array.from(length.toString(16).padStart(8, '0')).forEach(
      (hexChar: string, i: number) => {
        if (i % 2 === 0) {
          hex = hexChar;
        } else {
          hex += hexChar;
          buffer[(i + 1) / 2 - 1] = parseInt(hex, 16);
          hex = '';
        }
      }
    );
    return buffer.reverse();
  }
}

export interface NativeMessageOptions {}
