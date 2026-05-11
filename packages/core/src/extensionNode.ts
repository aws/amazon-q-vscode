/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode'

/**
 * The entrypoint for the nodejs version of the toolkit.
 *
 * Note: This is a legacy entry point from the AWS Toolkit extension.
 * The Amazon Q extension uses packages/amazonq/src/extensionNode.ts instead.
 */
export async function activate(_context: vscode.ExtensionContext) {
    // No-op: AWS Toolkit services have been removed from this repo.
    // The Amazon Q extension has its own activation path.
}

export async function deactivate() {
    // No-op
}
