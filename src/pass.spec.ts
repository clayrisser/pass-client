/*
 * File: /src/pass.spec.ts
 * Project: pass-client
 * File Created: 05-07-2021 14:35:37
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 05-07-2021 15:25:28
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

import Pass from '~/pass';

describe('new Pass().list()', () => {
  it('should list passwords with browserpass', async () => {
    const pass = new Pass();
    const data = await pass.list();
    expect(data).toMatchObject({
      files: {}
    });
    expect(typeof data.files.default?.length).toBe('number');
  });

  it('should list passwords without browserpass', async () => {
    const pass = new Pass({ browserpass: false });
    const data = await pass.list();
    expect(data).toMatchObject({
      files: {}
    });
    expect(typeof data.files.default?.length).toBe('number');
  });

  it('with and without browserpass should match', async () => {
    const withBrowserpassPass = new Pass();
    const withoutBrowserpassPass = new Pass({ browserpass: false });
    expect((await withBrowserpassPass.list()).files.default?.sort()).toEqual(
      (await withoutBrowserpassPass.list()).files.default?.sort()
    );
  });
});
