/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert'
import * as path from 'path'
import * as vscode from 'vscode'
import { CloudFormationTemplateRegistry } from '../../../shared/fs/templateRegistry'
import { makeTemporaryToolkitFolder } from '../../../shared/filesystemUtilities'
import { badYaml, makeSampleSamTemplateYaml, strToYamlFile } from '../cloudformation/cloudformationTestUtils'
import { assertEqualPaths } from '../../testUtil'
import * as CloudFormation from '../../../shared/cloudformation/cloudformation'
import { WatchedItem } from '../../../shared/fs/watchedFiles'
import { fs } from '../../../shared'

// TODO almost all of these tests should be moved to test WatchedFiles instead
describe('CloudFormation Template Registry', async function () {
    const goodYaml1 = makeSampleSamTemplateYaml(false)

    describe('CloudFormationTemplateRegistry', async function () {
        let testRegistry: CloudFormationTemplateRegistry
        let tempFolder: string

        beforeEach(async function () {
            tempFolder = await makeTemporaryToolkitFolder()
            testRegistry = new CloudFormationTemplateRegistry()
        })

        afterEach(async function () {
            await fs.delete(tempFolder, { recursive: true })
        })

        describe('addItem', async function () {
            it("adds data from a template to the registry and can receive the template's data", async () => {
                const filename = vscode.Uri.file(path.join(tempFolder, 'template.yaml'))
                await strToYamlFile(goodYaml1, filename.fsPath)
                await testRegistry.addItem(filename)

                assert.strictEqual(testRegistry.items.length, 1)

                const data = testRegistry.getItem(filename.fsPath)

                assertValidTestTemplate(data, filename.fsPath)
            })

            it('throws an error if the file to add is not a CF template', async function () {
                const filename = vscode.Uri.file(path.join(tempFolder, 'template.yaml'))
                await strToYamlFile(badYaml, filename.fsPath)

                assert.strictEqual(await testRegistry.addItem(vscode.Uri.file(filename.fsPath)), undefined)
            })
        })

        // other get cases are tested in the add section
        describe('items', async function () {
            it('returns an empty array if the registry has no registered templates', function () {
                assert.strictEqual(testRegistry.items.length, 0)
            })
        })

        // other get cases are tested in the add section
        describe('getRegisteredItem', async function () {
            it('Returns the item from the VSCode URI', async function () {
                const filename = vscode.Uri.file(path.join(tempFolder, 'template.yaml'))
                await strToYamlFile(goodYaml1, filename.fsPath)
                await testRegistry.addItem(filename)

                const data = testRegistry.getItem(filename)

                assertValidTestTemplate(data, filename.fsPath)
            })

            it('returns undefined if the registry has no registered templates', function () {
                assert.strictEqual(testRegistry.getItem('/template.yaml'), undefined)
            })

            it('returns undefined if the registry does not contain the template in question', async function () {
                const filename = vscode.Uri.file(path.join(tempFolder, 'template.yaml'))
                await strToYamlFile(goodYaml1, filename.fsPath)
                await testRegistry.addItem(vscode.Uri.file(filename.fsPath))

                assert.strictEqual(testRegistry.getItem('/not-the-template.yaml'), undefined)
            })
        })

        describe('removeTemplateFromRegistry', async function () {
            it('removes an added template', async function () {
                const filename = vscode.Uri.file(path.join(tempFolder, 'template.yaml'))
                await strToYamlFile(goodYaml1, filename.fsPath)
                await testRegistry.addItem(vscode.Uri.file(filename.fsPath))
                assert.strictEqual(testRegistry.items.length, 1)

                await testRegistry.remove(filename)
                assert.strictEqual(testRegistry.items.length, 0)
            })

            it('does not affect the registry if a nonexistant template is removed', async function () {
                const filename = vscode.Uri.file(path.join(tempFolder, 'template.yaml'))
                await strToYamlFile(goodYaml1, filename.fsPath)
                await testRegistry.addItem(vscode.Uri.file(filename.fsPath))
                assert.strictEqual(testRegistry.items.length, 1)

                await testRegistry.remove(vscode.Uri.file(path.join(tempFolder, 'wrong-template.yaml')))
                assert.strictEqual(testRegistry.items.length, 1)
            })
        })
    })
})

function assertValidTestTemplate(data: WatchedItem<CloudFormation.Template> | undefined, filename: string): void {
    assert.ok(data)
    if (data) {
        assertEqualPaths(data.path, filename)
        assert.ok(data.item.Resources?.TestResource)
    }
}
