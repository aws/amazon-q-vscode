/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert'
import { GlobalState } from '../../shared/globalState'
import { FakeMemento } from '../fakeExtensionContext'

describe('GlobalState', function () {
    let globalState: GlobalState
    const testKey = 'aws.downloadPath'

    beforeEach(async function () {
        const memento = new FakeMemento()
        globalState = new GlobalState(memento)
    })

    afterEach(async function () {})

    const scenarios = [
        { testValue: 1234, desc: 'number' },
        { testValue: 0, desc: 'default number' },
        { testValue: 'hello world', desc: 'string' },
        { testValue: '', desc: 'default string' },
        { testValue: true, desc: 'true' },
        { testValue: false, desc: 'false' },
        { testValue: [], desc: 'empty array' },
        { testValue: [{ value: 'foo' }, { value: 'bar' }], desc: 'array' },
        { testValue: {}, desc: 'empty object' },
        { testValue: { value: 'foo' }, desc: 'object' },
    ]

    describe('get()', function () {
        for (const scenario of scenarios) {
            it(scenario.desc, async () => {
                await globalState.update(testKey, scenario.testValue)

                const actualValue = globalState.get(testKey)
                assert.deepStrictEqual(actualValue, scenario.testValue)
            })
        }
    })

    describe('update()', function () {
        for (const scenario of scenarios) {
            it(scenario.desc, async () => {
                await globalState.update(testKey, scenario.testValue)
                const savedValue = globalState.get(testKey)
                assert.deepStrictEqual(savedValue, scenario.testValue)
            })
        }
    })

    it('getStrict()', async () => {
        //
        // Missing item:
        //
        const testKey = 'aws.downloadPath'
        assert.strictEqual(globalState.get(testKey), undefined)
        assert.strictEqual(globalState.getStrict(testKey, Boolean), undefined)
        assert.strictEqual(globalState.getStrict(testKey, Boolean, true), true)

        //
        // Item exists but has wrong type:
        //
        await globalState.update(testKey, 123)
        assert.throws(() => globalState.getStrict(testKey, String))
        assert.throws(() => globalState.getStrict(testKey, Object))
        assert.throws(() => globalState.getStrict(testKey, Boolean))
        // Wrong type, but defaultValue was given:
        assert.throws(() => globalState.getStrict(testKey, String, ''))
        assert.throws(() => globalState.getStrict(testKey, Object, {}))
        assert.throws(() => globalState.getStrict(testKey, Boolean, true))
    })

    it('tryGet()', async () => {
        //
        // Missing item:
        //
        const testKey = 'aws.downloadPath'
        assert.strictEqual(globalState.get(testKey), undefined)
        assert.strictEqual(globalState.tryGet(testKey, Boolean), undefined)
        assert.strictEqual(globalState.tryGet(testKey, Boolean, true), true)

        //
        // Item exists but has wrong type:
        //
        await globalState.update(testKey, 123)
        assert.strictEqual(globalState.tryGet(testKey, String), undefined)
        assert.strictEqual(globalState.tryGet(testKey, Object), undefined)
        assert.strictEqual(globalState.tryGet(testKey, Boolean), undefined)
        // Wrong type, but defaultValue was given:
        assert.deepStrictEqual(globalState.tryGet(testKey, String, ''), '')
        assert.deepStrictEqual(globalState.tryGet(testKey, Object, {}), {})
        assert.deepStrictEqual(globalState.tryGet(testKey, Boolean, true), true)
    })

    it('clear()', async () => {
        const keys = ['CODECATALYST_RECONNECT', 'SAM_INIT_ARCH_KEY', 'aws.redshift.connections']
        await globalState.update(keys[0] as any, 'val1')
        await globalState.update(keys[1] as any, 'val2')
        await globalState.update(keys[2] as any, 'val3')
        assert.deepStrictEqual(globalState.keys(), keys)
        assert.deepStrictEqual(globalState.values(), ['val1', 'val2', 'val3'])

        await globalState.clear()

        assert.deepStrictEqual(globalState.keys(), [])
        assert.deepStrictEqual(globalState.values(), [])
    })

    describe('SSO sessions', function () {
        const session1 = 'session-1'
        const session2 = 'session-2'
        const time1 = new Date(Date.now() - 42 * 1000) // in the past.
        const time2 = new Date()

        it('get/set', async () => {
            await globalState.setSsoSessionCreationDate(session1, time1)
            await globalState.setSsoSessionCreationDate(session2, time2)
            assert.deepStrictEqual(globalState.getSsoSessionCreationDate(session1), time1.getTime())
            assert.deepStrictEqual(globalState.getSsoSessionCreationDate(session2), time2.getTime())
        })

        it('validation', async () => {
            // Set bad state.
            await globalState.update('#sessionCreationDates', {
                [session1]: 'foo',
                [session2]: {},
            })

            // Bad state is logged and returns undefined.
            assert.deepStrictEqual(globalState.getSsoSessionCreationDate(session1), undefined)
            assert.deepStrictEqual(globalState.getSsoSessionCreationDate(session2), undefined)

            await globalState.setSsoSessionCreationDate(session2, time2)
            assert.deepStrictEqual(globalState.getSsoSessionCreationDate(session2), time2.getTime())
            // Stored state is now "partially bad".
            assert.deepStrictEqual(globalState.get('#sessionCreationDates'), {
                [session1]: 'foo',
                [session2]: time2.getTime(),
            })
        })
    })
})
