import {User} from "../types/db";
import {UserContext} from "../types/agent";


export function constructTaskContext (user: User) {

    const timeNow = new Date()
    const userTime: string = new Date(timeNow.getTime() + (user.user_timezone ?? 0) * 60 * 60 * 1000).toISOString();

    const userContext: UserContext = {
        name: user.name,
        time_at_user_location: userTime,
        language: user.language
    }

    return userContext
}