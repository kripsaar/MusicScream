import { Communication } from '../Communication';
import { User } from 'ClientApp/Models/UserModel';

export default class AuthService
{
    public static async login(userTO: User)
    {
        var reply = await Communication.ajaxPostJsonPromise("Account/Login", userTO);
        if (reply.userTO)
        {
            var newUserTO : User = reply.userTO;
            localStorage.setItem("currentUser", JSON.stringify(newUserTO))
        }
    }

    public static getCurrentUser() : User | null
    {
        var currentUserString : string | null = localStorage.getItem('currentUser');
        if (!currentUserString)
            return null;
        return JSON.parse(currentUserString);
    }
}