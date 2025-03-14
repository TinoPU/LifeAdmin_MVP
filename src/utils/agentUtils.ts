import {AgentContext} from "../types/agent";
import {constructUserContext} from "./userUtils";
import {User} from "../types/db";
import {constructTaskContext} from "./taskUtils";


export async function constructContext(user:User) {

    const userContext = constructUserContext(user)
    const taskContext = await constructTaskContext(user)

    const context:AgentContext = {
        userContext: userContext,
        taskContext: taskContext
    }
    return context
}