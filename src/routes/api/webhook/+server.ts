import { json } from '@sveltejs/kit'
import { request } from 'http'
import type { RequestEvent, RequestHandler } from './$types'
import { PAGE_ID } from '$env/static/private';
import type { PageEntry, MessagingEvent } from '../../../libs/MessengerInterfaces';
import { Pipeline, type Context } from '../../../libs/Pipeline';
import { helpCommand } from '../../../pipelines/help';
import { greetCommand } from '../../../pipelines/greet';
import { markSeen } from '../../../libs/MessengerAPI';
import type { Config } from '@sveltejs/adapter-vercel';
 
export const config: Config = {
  runtime: 'nodejs18.x'
};

const VERIFY_TOKEN = "ITSAGOODDAYTODIE"

export const GET: RequestHandler = (async ({ request, url }: RequestEvent) => {
    const mode = url.searchParams.get('hub.mode') ?? ''
    const verify_token = url.searchParams.get('hub.verify_token') ?? ''
    const challenge = url.searchParams.get('hub.challenge') ?? ''
    console.log(PAGE_ID)
    if (mode === '') return new Response('Invalid action', { status: 200 })

    if (mode === 'subscribe' &&
        verify_token === VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 })

    } else {
        return new Response(null, { status: 403 })
    }
})  satisfies RequestHandler;

export const POST: RequestHandler = (async({ request }: RequestEvent) => {
    const data = await request.json();
    console.log('received message from webhook')
    if (data.object === 'page') {
        data.entry.forEach((pageEntry: PageEntry) => {
            const pageID = pageEntry.id
            const timestamp = pageEntry.time

            pageEntry.messaging.forEach(async (event: MessagingEvent) => {
                if (event.message) {
                    return await processMessageEvent(event)
                } else if (event.optin) {
                    // do something
                } else if (event.delivery) {
                    // do something
                } else if (event.postback) {
                    // do something
                } else if (event.read) {
                    // do something
                } else if (event.account_linking) {
                    // do something
                } else {
                    // log error
                }
            })
        });
    }
    return new Response(null, { status: 200 })
})  satisfies RequestHandler;

const processMessageEvent = async (event: MessagingEvent) => {
    console.log('process message')
    const pageScopeID = event.sender.id
    const message = event.message
    const isEcho = message.is_echo
    const messageId = message.mid
    const appId = message.app_id
    const metadata = message.metadata
    const quickReply = message.quick_reply

    // only handle message from user not page
    if (pageScopeID != PAGE_ID) {
        let ctx: Context = {
            page_scope_id: pageScopeID,
            message: message,
            should_end: false
        }

        // setup execution pipeline
        const pipeline = Pipeline()
        pipeline.push(helpCommand)
        pipeline.push(greetCommand)
        console.log('check message type')
        if(message.text) {
            await pipeline.execute(ctx)
        }
    }

    if (isEcho) {
        // handle echo
        return
    }

    if (quickReply) {
        // handle quick reply
        return
    }

    await markSeen(pageScopeID)
}