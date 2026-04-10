/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as sinon from 'sinon'
import { promises as fs } from 'fs'
import assert from 'assert'
import { openErrorPage } from '../../../../awsService/sagemaker/detached-server/errorPage'
import * as utils from '../../../../awsService/sagemaker/detached-server/utils'

describe('openErrorPage', () => {
    let writeFileStub: sinon.SinonStub
    let openStub: sinon.SinonStub

    beforeEach(() => {
        writeFileStub = sinon.stub(fs, 'writeFile').resolves()
        openStub = sinon.stub(utils, 'open').resolves()
    })

    afterEach(() => {
        sinon.restore()
    })

    it('sanitizes title and message in the generated HTML', async () => {
        const title = '<script>alert("xss")</script>'
        const message = 'Error & <img src=x onerror=alert(1)>'

        await openErrorPage(title, message)

        assert(writeFileStub.calledOnce)
        const html = writeFileStub.firstCall.args[1]

        // Check that the title is escaped
        assert(html.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'))
        // Check that the message is escaped
        assert(html.includes('Error &amp; &lt;img src=x onerror=alert(1)&gt;'))

        // Check that the raw title and message are NOT present
        assert(!html.includes(title))
        assert(!html.includes(message))

        assert(openStub.calledOnce)
    })
})
