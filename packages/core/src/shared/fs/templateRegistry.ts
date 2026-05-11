/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode'
import * as CloudFormation from '../cloudformation/cloudformation'
import { WatchedFiles } from './watchedFiles'
import { getLogger } from '../logger/logger'
import globals from '../extensionGlobals'
import { Timeout } from '../utilities/timeoutUtils'
import { localize } from '../utilities/vsCodeUtils'
import { PerfLog } from '../logger/perfLogger'
import { showMessageWithCancel } from '../utilities/messages'

export class CloudFormationTemplateRegistry extends WatchedFiles<CloudFormation.Template> {
    public name: string = 'CloudFormationTemplateRegistry'

    protected async process(uri: vscode.Uri, contents?: string): Promise<CloudFormation.Template | undefined> {
        // P0: Assume all template.yaml/yml files are CFN templates and assign correct JSON schema.
        // P1: Alter registry functionality to search ALL YAML files and apply JSON schemas + add to registry based on validity

        const r = await CloudFormation.tryLoad(uri, contents)
        if (r.kind === undefined) {
            globals.schemaService.registerMapping({ uri, type: 'yaml', schema: undefined })
            return undefined
        }

        if (r.kind === 'sam') {
            globals.schemaService.registerMapping({ uri, type: 'yaml', schema: 'sam' })
        } else if (r.kind === 'cfn') {
            globals.schemaService.registerMapping({ uri, type: 'yaml', schema: 'cfn' })
        }

        return r.template
    }

    // handles delete case
    public override async remove(uri: vscode.Uri): Promise<void> {
        globals.schemaService.registerMapping({
            uri,
            type: 'yaml',
            schema: undefined,
        })
        await super.remove(uri)
    }
}

/**
 * The purpose of this class is to resolve a {@link CloudFormationTemplateRegistry}
 * instance once the given setup is complete.
 *
 * This solves the issue where setup can take a while and if we
 * block on it the entire extension startup time is increased.
 */
export class AsyncCloudFormationTemplateRegistry {
    /** Setup of the registry can take a while, this property indicates it is done */
    private isSetup = false
    private setupPromise: Thenable<CloudFormationTemplateRegistry> | undefined

    /**
     * @param asyncSetupFunc registry setup that will be run async
     */
    constructor(
        private readonly instance: CloudFormationTemplateRegistry,
        private readonly asyncSetupFunc: (
            instance: CloudFormationTemplateRegistry,
            cancelSetup: Timeout,
            onItem?: (total: number, i: number, cancelled: boolean) => void
        ) => Promise<CloudFormationTemplateRegistry>
    ) {}

    /**
     * Returns the initial registry instance if setup has completed, otherwise returns a temporary
     * instance and shows a progress message ("Scanning...") until setup is done.
     */
    async getInstance(): Promise<CloudFormationTemplateRegistry> {
        if (this.isSetup) {
            return this.instance
        }
        if (this.setupPromise) {
            getLogger().debug('%s: getInstance() requested, still initializing', this.instance.name)
            return this.setupPromise
        }

        // Show a "Scanning..." progress message until setup is done.
        const cancelSetup = new Timeout(30 * 60 * 1000) // 30 min
        const msg = localize(
            'AWS.codelens.waitingForTemplateRegistry',
            'Scanning CloudFormation templates (except [search.exclude](command:workbench.action.openSettings?"@id:search.exclude"))'
        )
        const progress = await showMessageWithCancel(msg, cancelSetup)

        const perf = new PerfLog(`${this.instance.name}: template registry setup`)
        this.setupPromise = this.asyncSetupFunc(this.instance, cancelSetup, (total: number, i: number) => {
            if (cancelSetup.completed) {
                getLogger().debug('%s: getInstance() cancelled', this.instance.name)
                return
            }
            if (total !== 0) {
                progress.report({ increment: 100 * (1 / total), message: i.toString() })
            }
        })

        this.setupPromise.then(
            () => {
                if (perf) {
                    perf.done()
                }
                this.isSetup = true
                cancelSetup.dispose()
            },
            (e) => {
                getLogger().error('AsyncCloudFormationTemplateRegistry: setupPromise failed: %s', (e as Error).message)
            }
        )

        return this.setupPromise
    }
}
