export interface User
{
    id: number;
    username: string;
    password: string;
    permissions: string[];
    token: string;
}

export enum UserPermissions
{
    BasicServiceRights = "BasicServiceRights",
    WritePlaylists = "WritePlaylists",
    WriteAllPlaylists = "WriteAllPlaylists",
    ReadUsers = "ReadUsers",
    WriteUsers = "WriteUsers"
}