import * as React from 'react';
import { Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { MusicPlayer } from './components/MusicPlayer/MusicPlayer'
import { PlaylistComponent } from './components/MusicPlayer/PlaylistComponent';
import { ArtistPage } from './components/Views/Artist/ArtistPage';
import { PlaylistPage } from './components/Views/Playlist/PlaylistPage';
import { Login } from './components/Login';
import AuthService from './util/AuthService';
import { UserPermissions } from './Models/UserModel';

export const routes = <Layout>
    <Route exact path='/' component={ Home } />
    <Route path='/MusicPlayer' component={ MusicPlayer as any } />
    <Route path='/songlist' component={ PlaylistComponent as any } />
    <Route path='/Artist/:id' render={ (props) => <ArtistPage id={props.match.params.id}/> } />
    <Route path='/Playlist/:id' render={(props) => <PlaylistPage id={props.match.params.id}/>}/>
    <Route path='/Login' component={ Login as any } />
</Layout>;


export function getRoutes()
{
    var routes: JSX.Element[] = [];
    var currentUser = AuthService.getCurrentUser();

    if (!currentUser)
        routes = routes.concat([
            <Route path='/Login' component={ Login as any } />
        ]);

    if (currentUser && currentUser.permissions.indexOf(UserPermissions.BasicServiceRights) !== -1)
        routes = routes.concat([
            <Route exact path='/' component={ Home } />,
            <Route path='/MusicPlayer' component={ MusicPlayer as any } />,
            <Route path='/songlist' component={ PlaylistComponent as any } />,
            <Route path='/Artist/:id' render={ (props) => <ArtistPage id={props.match.params.id}/> } />,
            <Route path='/Playlist/:id' render={(props) => <PlaylistPage id={props.match.params.id}/>}/>
        ]);


    return <Layout>
        {routes}
    </Layout>
}