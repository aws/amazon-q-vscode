/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert'
import { qTestingFramework } from './framework/framework'
import sinon from 'sinon'
import { Messenger } from './framework/messenger'
import { MynahUIDataModel } from '@aws/mynah-ui'
import { FeatureContext } from 'aws-core-vscode/shared'
import { assertContextCommands, assertQuickActions } from './assert'

describe('Amazon Q Welcome page', function () {
    let framework: qTestingFramework
    let tab: Messenger
    let store: MynahUIDataModel

    const availableCommands = ['/transform', '/help', '/clear']

    const highlightCommand: FeatureContext = {
        name: 'highlightCommand',
        value: {
            stringValue: '@highlight',
        },
        variation: 'highlight command desc',
    }
    beforeEach(() => {
        framework = new qTestingFramework('welcome', true, [['highlightCommand', highlightCommand]], 0)
        tab = framework.getTabs()[0] // use the default tab that gets created
        store = tab.getStore()
    })

    afterEach(() => {
        framework.removeTab(tab.tabID)
        framework.dispose()
        sinon.restore()
    })

    it(`Shows quick actions: ${availableCommands.join(', ')}`, async () => {
        assertQuickActions(tab, availableCommands)
    })

    it('Shows context commands', async () => {
        assertContextCommands(tab, ['@workspace', '@highlight'])
    })

    describe('shows 5 times', async () => {
        it('new tabs', () => {
            framework.createTab()
            framework.createTab()
            framework.createTab()
            framework.createTab()

            let welcomeCount = 0
            for (const tab of framework.getTabs()) {
                if (tab.getStore().tabTitle === 'Welcome to Q') {
                    welcomeCount++
                }
            }
            // all 5 tabs are welcome tabs since the closure captures the initial welcomeCount because there is no more / commands
            assert.deepStrictEqual(welcomeCount, 5)

            // 0 normal tabs
            assert.deepStrictEqual(framework.getTabs().length - welcomeCount, 0)
        })

        it('new windows', () => {
            // check the initial window
            assert.deepStrictEqual(store.tabTitle, 'Welcome to Q')
            framework.dispose()

            // check when theres already been two welcome tabs shown
            framework = new qTestingFramework('welcome', true, [], 2)
            const secondStore = framework.getTabs()[0].getStore()
            assert.deepStrictEqual(secondStore.tabTitle, 'Welcome to Q')
            framework.dispose()

            // check when theres already been three welcome tabs shown
            framework = new qTestingFramework('welcome', true, [], 3)
            const thirdStore = framework.getTabs()[0].getStore()
            assert.deepStrictEqual(thirdStore.tabTitle, 'Chat')
            framework.dispose()
        })
    })

    describe('Welcome actions', () => {
        it('quick-start', async () => {
            tab.clickInBodyButton('quick-start')

            // clicking quick start opens in the current tab and changes the compact mode
            assert.deepStrictEqual(tab.getStore().compactMode, false)
        })
    })
})
