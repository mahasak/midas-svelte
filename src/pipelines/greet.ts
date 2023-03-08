import { sendTextMessage } from "../libs/MessengerAPI"
import type { Context, MiddlewareNextAction } from "../libs/Pipeline"



export const greetCommand = async (ctx: Context, _next: MiddlewareNextAction) => {
    const hey = "Hi,\r\nPlease send #help to see suppport commands."

    await sendTextMessage(ctx.page_scope_id, hey)
}